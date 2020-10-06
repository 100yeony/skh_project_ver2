#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const progress = require('cli-progress');
const execFile = require('child_process').execFile;
const exec = require('child_process').execSync;
const property = require('../../propertiesReader.js');
const cmds = require('../lib/cmds.js');
const cassandraAction = require('../lib/cassandra.js')
const fs = require('fs');

let ip;
let installDir;

let packageName;
let stdout;
let version;
let startTime = 0
let endTime = 0
let case_;
let server_ip = property.get_server_IP();
let server_homedir = property.get_server_homedir();
let node_homedir = property.get_node_homedir();
let server_installDir = server_homedir +'/package';
let node_installDir = node_homedir +'/package';
let nodes = property.get_nodes_IP();
let node_arr = nodes.split(',');
let packageAll = ['java', 'maven', 'python']
let databaseAll = ['cassandra', 'orientdb', 'arangodb']


program
  .command('install')
  .option('-p, --package <pkgname>', `Install Package (java|python|maven)`)
  .option('-d, --database <dbname>', `Install Database (cassandra|orientdb|arangodb)`)
  .option('-s, --server', `Install into server, only can use with -p option`)
  .option('-n, --node', `Install into node, only can use with -p option`)
  .option('-a, --all', `Install all into server & node`)
  .option('-t, --tool <toolname>', `Install Benchmarking tool (nosqltest)`)
  .action(function Action(opt){
    exec(`chmod -R +x .`)

    if(opt.package){
      if(opt.package && (opt.server || opt.node )){
        case_ = 1
      }else{
        console.log(chalk.red.bold('[ERROR]'), 'please enter -s or -n option');
      }
    }else if(opt.database){
      case_ = 2
    }else if(opt.all){
      case_ = 3
    }else if(opt.tool){
      case_ = 4
    }

    switch(case_){
      case 1:
        if(opt.server){
          console.log('==========================================================');
          console.log(chalk.green.bold('[INFO]'), 'Install', chalk.green.bold(opt.package), 'into server');
          console.log('==========================================================');
          ip = [server_ip]
          installDir = server_installDir;
          // isInstalledPkg(i, opt.package, installDir, node_arr)
          installPackage(ip, opt.package, installDir);
        }else if(opt.node){
          console.log('==========================================================');
          console.log(chalk.green.bold('[INFO]'), 'Install', chalk.green.bold(opt.package), 'into nodes');
          console.log('==========================================================');
          sendPackage(node_arr)
          installDir = node_installDir;
          node_arr.forEach(i =>{
            // isInstalledPkg(i, opt.package, installDir, node_arr)
            installPackage(i, opt.package, installDir);
          })
        }

        break;

      case 2:
        console.log('==========================================================');
        console.log(chalk.green.bold('[INFO]'), 'Install', chalk.green.bold(opt.database));
        console.log('==========================================================');
        ip = nodes.split(',');
        ip.push(server_ip);
        ip = ip.sort();
        var db = opt.database
        if(db == 'cassandra'||db == 'orientdb'||db == 'arangodb'){
          if(db == 'orientdb'){
              fixOrientdbInServer(node_arr)
            }
            installDatabase(db, nodes, node_arr);
        }else{
          console.log(chalk.red.bold('[ERROR]'), 'please check the db name is cassandra|orientdb|arangodb');
        }
        break;

      case 3:
        console.log('==========================================================');
        console.log(chalk.green.bold('[INFO]'), 'Install packages and Databases');
        console.log('==========================================================');
        sendPackage(node_arr)
        ip = nodes.split(',');
        ip.push(server_ip);
        ip = ip.sort();
        for(var pck of packageAll){
          console.log(chalk.green.bold('[INFO]'), 'Install', chalk.green.bold(pck));
          ip.forEach(i=>{
          installPackage(i, pck, installDir);
          })
        console.log('==========================================================');
        }

        sendKillShell(node_arr)
        console.log('==========================================================');
        if(db == 'orientdb'){
          fixOrientdbInServer(node_arr)
        }
        for(var db of databaseAll){
          installDatabase(db, nodes, node_arr);
          console.log('==========================================================');
        }
        break;

      case 4:
        if(opt.tool == 'nosqltest'){
          console.log('==========================================================');
          console.log(chalk.green.bold('[INFO]'), 'Install', chalk.green.bold(opt.tool));
          console.log('==========================================================');
          let tool = ['nosqltest']
          installTool(tool[0]);
        }else{
        console.log(chalk.red.bold('[ERROR]'), 'please enter nosqltest');
        }
        break;
    }//switch end
 })
program.parse(process.argv)


function getTime(){
  let today = new Date();
  let time = today.toLocaleTimeString();
  return time
}


function isInstalledPkg(i, package, installDir, ip){
   console.log('----------------------------------------------------------');
   console.log(chalk.green.bold('[INFO]'), 'Installation', chalk.blue.bold(package), 'into IP address', chalk.blue.bold(i));
   // installDir = i==property.get_server_IP()? server_installDir : node_installDir;
   // console.log(installDir);
   switch(package){
     case 'java' :
       packageName = cmds.java;
       break;

     case 'maven' :
       packageName = cmds.maven;
       break;

     case 'python' :
       packageName = cmds.python;
       break;

     default :
       console.log(chalk.red.bold('[ERROR]'), package,'is cannot be installed. Try again other package.');
       // exec(`exit`)
       // return 0;
   }
      // try{
      //   var res = exec(`ssh root@${i} ls ${installDir}/${package}`).toString();
      //   res.contain("File exists")
      //   if(res){
      //     console.log(chalk.green.bold('[INFO]'), 'directory exists');
      //   } //디렉토리 있음
      //   else{
      //     exec(`ssh root@${i} mkdir -p ./skh_project/package/maven`)
      //     exec(`ssh root@${i} mkdir -p ./skh_project/package/java`)
      //     exec(`ssh root@${i} mkdir -p ./skh_project/package/python`)
      //     // `scp <JDK PATH> root@${i}:/PATH/TO/TARGET`
      //   } //없음
      // }
      // catch(e){
      //   //노드와 서버에 /root/ssdStorage/skh_project/package/*가 있어야 함.
      //   console.log(chalk.green.bold('[INFO]'), 'file or directory does not exist');
      //   // exec(`scp -r ${server_homedir}/Installation/rpm/${package} root@${i}:${installDir}`)
      //   exec(`scp -r ${server_homedir}/Installation/rpm/${package} root@${i}:${installDir}`)
      //   console.log(chalk.green.bold('[INFO]'), 'Sending rpm file to', i,'complete! Ready to install other package.');
      // }


      // if(package == 'java'||'maven'){


      // try{
      //   stdout = exec(`ssh root@${i} "rpm -qa|grep ${packageName}"`).toString();
      //   if(stdout!=null){
      //     console.log(chalk.green.bold('[INFO]'), package, 'is already installed.');
      //     console.log(chalk.green.bold('[INFO]'), 'Check the version is matching or not ...');
      //     versionCheck(i, package, installDir, ip);
      //   }
      // }
      // catch(e){
        installPackage(i, package, installDir, ip);
      // }
    // }

    // })
  // }

  // export JAVA_HOME=/root/ssdStorage/skh_project/jdk1.8.0_121
  // export MAVEN_HOME=/root/ssdStorage/skh_project/Installation/rpm/maven
  // export PATH=$PATH:$JAVA_HOME/bin
  // export PATH=$PATH:$MAVEN_HOME/bin


      // if(package == 'git'||'java'||'maven'){
        try{
          stdout = exec(`ssh root@${i} "rpm -qa|grep ${packageName}"`).toString();
          if(stdout!=null){
            console.log(chalk.green.bold('[INFO]'), package, 'is already installed.');
            console.log(chalk.green.bold('[INFO]'), 'Check the version is matching or not ...');
            // versionCheck(i, package, installDir);
          }
          if(package == 'maven'){
            makeMavenHome(i)
          }
        }
        catch(e){
          installPackage(i, package, installDir);
        }
      // }


    console.log(chalk.green.bold('[INFO]'), 'Ready to use Maven.');
  }

  // /etc/profile 에 추가
  // export JAVA_HOME=/usr/lib/jvm/java-1.8.0-openjdk-1.8.0.232.b09-2.el8_1.x86_64/jre/
  // export MAVEN_HOME=/root/maven
  // export PATH=$PATH:$JAVA_HOME/bin
  // export PATH=$PATH:$MAVEN_HOME/bin




// function makePythonLink(i){
//   exec(`ssh root@${i}`)
//   exec(`rm -f /usr/bin/python`)
//   exec(`ln -s /usr/bin/python2.7 /usr/bin/python`)
//   console.log(chalk.green.bold('[INFO]'), 'Make Symbolic link. Ready to use python');
// }




function versionCheck(i, package, installDir, ip){
  console.log(chalk.green.bold('[INFO]'), 'Start version check ...');
    switch(package){
      case 'maven' :
        version = property.get_mavenVersion()
        break;
      case 'python' :
        version = property.get_pythonVersion()
        break;
      case 'java' :
        version = property.get_javaVersion()
        break;
    }
    stdout = exec(`ssh root@${i} "rpm -qa|grep ${package}"`).toString();
    if(stdout.includes(version)){
      if(package == 'python'){
        makePythonLink(i);
      }else{
        console.log(chalk.green.bold('[INFO]'), 'Version is matched. Nothing has changed.');
      }
    }else{
      console.log(chalk.green.bold('[INFO]'), 'Version is not matched. Delete', package);
      deletePackage(i, package);
      console.log(chalk.green.bold('[INFO]'), 'Install new version of', package);
      installPackage(i, package, installDir, ip);
    }
  }

  // export JAVA_HOME=/root/ssdStorage/skh_project/jdk1.8.0_121/
  // export MAVEN_HOME=/root/maven
  // export PATH=$PATH:$JAVA_HOME/bin
  // export PATH=$PATH:$MAVEN_HOME/bin

    function sendPackage(node_arr){
      node_arr.forEach(i=>{
        try{
          let checkdir_cmd = `ssh root@${i} ls -l ${node_homedir}/package`
          exec(checkdir_cmd)
          // console.log(chalk.yellow.bold('[WARNING]'), 'package directory exists in', chalk.blue.bold(i));
        }catch(error){
          exec(`scp -r package root@${i}:/${node_homedir}`)
          console.log(chalk.green.bold('[INFO]'), 'sending package directory into', chalk.blue.bold(i),'complete!');
        }
      })
    }


  function installPackage(i, package, installDir){
    let update_etc_profile_cmd = `ssh root@${i} source /etc/profile`

    switch(package){
     case 'java' :
       // /etc/profile에 JAVA_HOME 설정이 이미 잡혀있는지 체크
       let check_javaHome_cmd = `ssh root@${i} 'sed -n "/export JAVA_HOME=/p"' /etc/profile`
       //기존에 /etc/profile의 JAVA_HOME을 주석처리
       let fix_javaHome_cmd = `ssh root@${i} 'sed -i "s|export JAVA_HOME=|#export JAVA_HOME=|"' /etc/profile`
       //프로젝트 폴더에 넣어놓은 JAVA로 HOME을 재설정
       let fix_javaHome_cmd2 = `ssh root@${i} 'sed -i'' -r -e "/export JAVA_HOME=/a\export JAVA_HOME=${installDir}/java/jdk1.8.0_121"' /etc/profile`

       let checkJava = exec(check_javaHome_cmd)
       // console.log(checkJava.toString());
       if(!checkJava.includes(`${installDir}`)){
         exec(fix_javaHome_cmd)
         exec(fix_javaHome_cmd2)
         exec(update_etc_profile_cmd)
         console.log(chalk.green.bold('[INFO]'), 'sending package directory into', chalk.blue.bold(i),'complete!');
         console.log(chalk.green.bold('[INFO]'), 'fix JAVA_HOME in /etc/profile into', chalk.blue.bold(i), 'complete!');
         console.log('----------------------------------------------------------');
       }else{
         console.log(chalk.yellow.bold('[WARNING]'), 'JAVA_HOME is already set in', chalk.blue.bold(i));
       }
      break;

     case 'maven' :
       let check_mavenHome_cmd = `ssh root@${i} 'sed -n "/MAVEN_HOME/p"' /etc/profile`

       //기존에 /etc/profile의 JAVA_HOME을 주석처리
       let fix_mavenHome_cmd = `ssh root@${i} 'sed -i "s|export MAVEN_HOME=|#export MAVEN_HOME=|"' /etc/profile`
       //프로젝트 폴더에 넣어놓은 JAVA로 HOME을 재설정
       //export MAVEN_HOME= 이 있는 라인 아래에 새로운 행이 추가됨(a)/(i는 위에 추가)
       let fix_mavenHome_cmd2 = `ssh root@${i} 'sed -i'' -r -e "/export MAVEN_HOME=/a\export MAVEN_HOME=${installDir}/maven"' /etc/profile`

       let checkMaven = exec(check_mavenHome_cmd)
       if(checkMaven.includes('export MAVEN_HOME')){
         console.log(chalk.yellow.bold('[WARNING]'), 'MAVEN_HOME is already set in', chalk.blue.bold(i));
       }else{
         let fix_mavenHome_cmd3 = `ssh root@${i} 'sed -i'' -r -e "/export JAVA_HOME=/i\export MAVEN_HOME=${installDir}/maven"' /etc/profile`
         let fix_mavenHome_cmd4 = `ssh root@${i} 'sed -i'' -r -e "/export MAVEN_HOME=/a\export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:${installDir}/java/jdk1.8.0_121/bin:${installDir}/maven/bin"' /etc/profile`
         exec(fix_mavenHome_cmd3)
         exec(fix_mavenHome_cmd4)
         exec(update_etc_profile_cmd)
         console.log(chalk.green.bold('[INFO]'), 'sending package directory into', chalk.blue.bold(i),'complete!');
         console.log(chalk.green.bold('[INFO]'), 'fix MAVEN_HOME in /etc/profile into', chalk.blue.bold(i), 'complete!');
         console.log('----------------------------------------------------------');
       }
       break;

     case 'python' :
      // ls -l : 심볼릭 링크 모두 출력
      // ls -l /usr/bin/python* : python이 포함된 심볼릭 링크 출력

      // ll /usr/bin |grep python : /usr/bin에 python이 포함된 링크 모두 출력
      // rm -f python : python심볼릭 링크를 먼저 삭제
      // ln -s /usr/bin/python2.6 python : python 명령어를 치면 /usr/bin/python2.6으로 연결시키는 링크 생성

       let check_python_cmd = `ssh root@${i} ls /usr/bin |grep python`
       let checkPython = exec(check_python_cmd).toString()
       let installPython3_cmd = `ssh root@${i} yum install python36u python36u-pip python36u-devel`
       let make_python2_symbolic = `ssh root@${i} ln -s /usr/bin/python2.6 python`
       let make_python3_symbolic = `ssh root@${i} ln -s /usr/bin/python3.6 python`
       let rm_python_symbolic = `ssh root@${i} ln -s rm -f python`

       let check_python_cmd2 = `ssh root@${i} ls /usr/bin/python`
       let checkTemp = exec(check_python_cmd2).toString();
       console.log('test',checkTemp.includes('python3'));

       // let temp = exec(check_python_cmd).toString().split('\n')

       // console.log('temp:', temp[3]);
       // console.log(i);
       //39에 python3있음
       // console.log(checkPython);

       if(i==server_ip){
         console.log(chalk.green.bold('[INFO]'), 'cassandra CQL needs python3 in', chalk.blue.bold(i));
         if(checkPython.includes('python3.6')){
           // console.log(chalk.yellow.bold('[WARNING]'), 'Python3 is already set in', chalk.blue.bold(i));
           exec(rm_python_symbolic)
           console.log(chalk.green.bold('[INFO]'), 'remove python symbolic link in', chalk.blue.bold(i));

           exec(make_python3_symbolic)
           console.log(chalk.green.bold('[INFO]'), 'set python3.6 symbolic link in', chalk.blue.bold(i));
         }else{
           //python3.6 설치
           exec(installPython3_cmd)
           console.log(chalk.green.bold('[INFO]'), 'install python3.6 in', chalk.blue.bold(i));

           exec(make_python3_symbolic)
           console.log(chalk.green.bold('[INFO]'), 'set python3.6 symbolic link in', chalk.blue.bold(i));
         }
       }
       else{
         //노드에는 기본 python을 사용함
         if(checkPython.includes('python')){
           console.log(chalk.yellow.bold('[WARNING]'), 'Python is already set in', chalk.blue.bold(i));
         }else{
           if(checkPython.includes('python2.6')){

             exec(make_python2_symbolic)
             console.log(chalk.green.bold('[INFO]'), 'set python2.6 symbolic link in', chalk.blue.bold(i));
           }
         }

       }
       break;
     }
}


 function deletePackage(i, package){
   switch(package){
     case 'java' :
       packageName = cmds.java
       break;
     case 'python' :
       packageName = cmds.python
       break;
     case 'maven' :
       packageName = cmds.maven
       break;
     }
    if(package == 'java'||'maven'){
      exec(`ssh root@${i} ${cmds.yumDeleteCmd} ${packageName}*`)
    }else{
      exec(`ssh root@${i} ${cmds.deleteCmd} ${packageName}`)
    }
    //python은 delete아니지않나?symbolic인데
    console.log(chalk.green.bold('[INFO]'), package, 'Deletion complete!');
    exec(`exit`)
  }


function sendKillShell(node_arr){
  node_arr.forEach(i=>{
    try{
      let checkdir_cmd = `ssh root@${i} ls -l ${node_homedir}/killShell`
      exec(checkdir_cmd)
      console.log(chalk.yellow.bold('[WARNING]'), 'killShell is already installed in', chalk.blue.bold(i));
    }catch(error){
      exec(`scp -r killShell root@${i}:/${node_homedir}`)
      console.log(chalk.green.bold('[INFO]'), 'sending killShell');
    }
  })
}


function fixOrientdbInServer(node_arr){
  let fixDir_cmd1 = `sed -i 11c'ORIENTDB_DIR="orientdb"' ${server_homedir}/orientdb/bin/orientdb.sh`
  let fixDir_cmd2 = `sed -i "10,11s|orientdb|"${node_homedir}/orientdb"|" ${server_homedir}/orientdb/bin/orientdb.sh`
  exec(fixDir_cmd1)
  exec(fixDir_cmd2)
  console.log(chalk.green.bold('[INFO]'), 'fix bin/orientdb.sh complete!');

  let line1 = 43
  let line2 = 11
  node_arr.forEach(i=>{
    let hazel_cmd = `sed -i ${line1}c'<member>${i}</member>' ${server_homedir}/orientdb/config/hazelcast.xml`
    exec(hazel_cmd)
    console.log(chalk.green.bold('[INFO]'), 'fix config/hazelcast.xml complete!');
    let fixdistributed_cmd
    if(i==node_arr[0]){
      fixdistributed_cmd = `sed -i 11c'"orientdb${i.slice(11)}": "master",' ${server_homedir}/orientdb/config/default-distributed-db-config.json`
    }
    //ip배열의 마지막 인덱스
    else if(i ==node_arr[node_arr.length-1]){
      fixdistributed_cmd = `sed -i ${line2}c'"orientdb${i.slice(11)}": "replica"' ${server_homedir}/orientdb/config/default-distributed-db-config.json`
    }else{
      fixdistributed_cmd = `sed -i ${line2}c'"orientdb${i.slice(11)}": "replica",' ${server_homedir}/orientdb/config/default-distributed-db-config.json`
    }
    exec(fixdistributed_cmd)
    console.log(chalk.green.bold('[INFO]'), 'fix config/default-distributed-db-config.json complete!');
    line1++;
    line2++;
  })
  console.log('----------------------------------------------------------');
}

function installDatabase(db, nodes, node_arr){
  console.log(chalk.green.bold('[INFO]'), 'Install', chalk.green.bold(db));
    node_arr.forEach(i=>{
        switch(db){
            case 'cassandra' :
             var dir = property.get_server_cassandra_dir()
             var node_dir = property.get_node_homedir()+ '/cassandra'
              // var version = property.get_cassandra_version()
             var cassandraHome = property.get_server_homedir()+ '/cassandra'
             var conf = `${cassandraHome}/conf/cassandra.yaml`
             // var update_conf = property.get_update_conf_path()
             var update_conf = property.get_server_homedir()+'/Update'
             var exists = fs.existsSync(`${conf}`);

             try{
               let checkdir_cmd = `ssh root@${i} ls -l ${node_homedir}/cassandra`
               exec(checkdir_cmd);
               console.log(chalk.yellow.bold('[WARNING]'), 'cassandra is already installed in', chalk.blue.bold(i));
             }catch(error){
               // console.log(error.toString());
               if(exists==true){
                cassandraAction.cassandraSetClusterEnv(conf, nodes);
                console.log(chalk.green.bold('[INFO]'), 'cassandra Set Cluster Environments', chalk.blue.bold(i));
               }else{
                 console.log(chalk.red.bold('[Error]'), 'conf file not found');
                 break;
               }
               cassandraAction.cassandraCopy(nodes, i, cassandraHome, node_dir, conf, update_conf);
               console.log(chalk.green.bold('[INFO]'), 'Install Cassandra Complete!');
               console.log('----------------------------------------------------------');
              }
              break;


            case 'arangodb' :
              try{
                stdout = exec(`ssh root@${i} "rpm -qa|grep arango"`).toString();
                if(stdout!=null){
                  console.log(chalk.yellow.bold('[WARNING]'),'ArangoDB is already installed in', chalk.blue.bold(i));
                }
              }catch(error){
                let wget_cmd = `ssh root@${i} wget -P ${node_homedir} https://download.arangodb.com/9c169fe900ff79790395784287bfa82f0dc0059375a34a2881b9b745c8efd42e/arangodb36/Enterprise/Linux/arangodb3e-3.6.3-1.1.x86_64.rpm`
                let rpmivh_cmd = `ssh root@${i} rpm -ivh ${node_homedir}/arangodb3e-3.6.3-1.1.x86_64.rpm`
                let rm_cmd = `ssh root@${i} rm -rf ${node_homedir}/arangodb3e-3.6.3-1.1.x86_64.rpm`
                exec(wget_cmd)
                exec(rpmivh_cmd)
                exec(rm_cmd)
                console.log(chalk.green.bold('[INFO]'), 'Install ArangoDB Complete!');
                console.log('----------------------------------------------------------');
              }
              break;

            case 'orientdb' :
              //노드에 설치하기 위해 서버에서 미리 orientdb 만들어놓고 보낸 후 수정
              //서버에 있는거 installConfig 값 읽어와서 sed로 변경한 뒤 노드로 배포
              //변경할 파일
              //1. bin/orientdb.sh
              //2. config/hazelcast.xml
              //3. config/default-distributed-db-config.json

              dirnum = i.split('.');
              let homeNum = "orientdb"+dirnum[dirnum.length-1]
              // console.log('homeNum :', homeNum);

              startTime = getTime();

              try{
                let checkdir_cmd = `ssh root@${i} ls -l ${node_homedir}/${homeNum}`
                exec(checkdir_cmd);
                console.log(chalk.yellow.bold('[WARNING]'), homeNum, 'is already installed in', chalk.blue.bold(i));
              }catch(error){
                console.log(chalk.green.bold('[INFO]'), 'Waiting for send orientdb to', chalk.blue.bold(i) , '... It will take a few minutes');

                exec(`scp -r ${server_homedir}/orientdb root@${i}:${node_homedir}`)
                console.log(chalk.green.bold('[INFO]'), 'Sending complete!');

                let mv_cmd = `ssh root@${i} mv ${node_homedir}/orientdb ${node_homedir}/${homeNum}`
                let fixDir_cmd = `ssh root@${i} 'sed -i "10,11s|"${node_homedir}/orientdb"|"${node_homedir}/${homeNum}"|"' ${node_homedir}/${homeNum}/bin/orientdb.sh`
                let fixUser_cmd = `ssh root@${i} 'sed -i "12,13s|"orientdb"|"${homeNum}"|"' ${node_homedir}/${homeNum}/bin/orientdb.sh`
                let chmodCmd = `ssh -t root@${i} chmod 640 ${node_homedir}/${homeNum}/config/orientdb-server-config.xml`
                let fixNodeName_cmd = `ssh root@${i} 'sed -i "15,16s|orientdb|${homeNum}|"' ${node_homedir}/${homeNum}/config/orientdb-server-config.xml`
                let fixdatabases_cmd = `ssh root@${i} 'sed -i "93,94s|orientdb|${homeNum}|"' ${node_homedir}/${homeNum}/config/orientdb-server-config.xml`

                exec(mv_cmd)
                exec(fixDir_cmd)
                exec(fixUser_cmd)
                console.log(chalk.green.bold('[INFO]'), 'fix orientdb.sh complete!');
                exec(chmodCmd)
                console.log(chalk.green.bold('[INFO]'), 'exec chmod complete!');
                exec(fixNodeName_cmd)
                exec(fixdatabases_cmd)
                console.log(chalk.green.bold('[INFO]'), 'fix orientdb-server-config.xml complete!');

                endTime = getTime();
                console.log(chalk.green.bold('[INFO]'), 'Installation Complete! * Start Time:', startTime, '* End Time:', endTime, '*');
                console.log('----------------------------------------------------------');
              }
              break;
         }
      })
  }


  function installTool(tool){
    console.log(chalk.green.bold('[INFO]'), 'Installation', chalk.blue.bold(tool));
  }
