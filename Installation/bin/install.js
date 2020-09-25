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
let packageAll;
let version;
let startTime = 0
let endTime = 0
let server_homedir = property.get_server_homedir();
let node_homedir = property.get_node_homedir();


program
  .command('install')
  .option('-p, --package <pkgname>', `Install Package (java|python|maven)`)
  .option('-d, --database <dbname>', `Install Database (cassandra|orientdb|arangodb)`)
  .option('-s, --server', `Install into server, only can use with -p option`)
  .option('-n, --node', `Install into node, only can use with -p option`)
  .option('-a, --all', `Install all into server & node`)
  .option('-t, --tool <toolname>', `Install Benchmarking tool (nosqltest)`)
  .action(function Action(opt){
    //case 1. -p + -s||-n

    exec(`chmod -R +x .`)
    if(opt.package && (opt.server || opt.node )){
      if(opt.server){
        ip = [property.get_server_IP()]
        installDir = property.get_server_install_dir(); // root/skh_project
      }else if(opt.node){
        ip = property.get_nodes_IP().split(',');
        installDir = property.get_node_install_dir(); // root/ssdStorage
        if(package == maven){
          return 0;
        }
      }
      ip.forEach(i =>{
        isInstalledPkg(i, opt.package, installDir, ip)
      })
    }

    //case 2. -d(-n으로 디폴트)
    if(opt.database){
      var nodes = property.get_nodes_IP();
      var node_arr = nodes.split(',');
      //installDir = property.get_node_install_dir(); // root/ssdStorage
      var db = opt.database
      if(db == 'cassandra'||db == 'orientdb'||db == 'arangodb'){
        installDatabase(db, nodes, node_arr);
      }else{
        console.log(chalk.red.bold('[ERROR]'), 'please check the db name is cassandra|orientdb|arangodb');
      }

    }
    //옵션 뒤에 인자 받는 경우 boolean 값으로 저장됨

    //case 3. -a
    if(opt.all){
      ip = property.get_nodes_IP().split(',');
      ip.push(property.get_server_IP());
      ip = ip.sort();
      packageAll = ['python', 'java', 'maven']
      // let idx = 0
      ip.forEach((i, idx) => {
        // console.log('???????', i, idx);
        if(idx != 0){
          if(packageAll.indexOf('maven') != -1)
            packageAll.splice(packageAll.indexOf('maven'),1)
          // console.log('packageAll===>', packageAll);
        }
        packageAll.forEach( pck => {
            isInstalledPkg(i, pck, installDir, ip)
        })
      });

      //아예 -a옵션은 패키지만 설치하는거로 설명을 바꿀까...
      var nodes = property.get_nodes_IP();
      var node_arr = nodes.split(',');
      ip = property.get_nodes_IP().split(',');
      //installDir = property.get_node_install_dir(); // root/ssdStorage
      databaseAll = ['cassandra']
      for(var db of databaseAll){
        installDatabase(db, nodes, node_arr);
      }
    }
    //case 4. -t
    if(opt.tool){
      let tool = ['nosqltest']
      installTool(tool[0]);
    }
 })
program.parse(process.argv)

function getTime(){
  let today = new Date();
  let time = today.toLocaleTimeString();
  return time
}

function isInstalledPkg(i, package, installDir, ip){
  // ip.forEach((i) => {
   console.log('----------------------------------------------------------');
   console.log(chalk.green.bold('[INFO]'), 'Installation', chalk.blue.bold(package), 'into IP address', chalk.blue.bold(i));
   installDir = i==property.get_server_IP()? property.get_server_install_dir() : property.get_node_install_dir();
   switch(package){
     case 'java' :
       packageName = cmds.java;
       break;
     case 'python' :
       packageName = cmds.python;
       break;
     case 'maven' :
       packageName = cmds.maven;
       break;
     default :
       console.log(chalk.red.bold('[ERROR]'), package,'is cannot be installed. Try again other package.');
       // exec(`exit`)
       // return 0;
   }
      // try{
      //   var res = exec(`ssh root@${i} ls ${installDir}${package}`).toString();
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
            versionCheck(i, package, installDir);
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


  function makeMavenHome(i){
    exec(`scp /etc/profile root@${i}:${installDir}`)
    console.log(chalk.green.bold('[INFO]'), 'Sending /etc/profile to', i);
    exec(`ssh root@${i} cat ${installDir}profile > /etc/profile`)
    exec(`ssh root@${i} chmod +x /root/maven/bin/mvn`)
    exec(`ssh root@${i} source /etc/profile`)

    exec(`exit`)
    console.log(chalk.green.bold('[INFO]'), 'Ready to use Maven.');
  }




function makePythonLink(i){
  exec(`ssh root@${i}`)
  exec(`rm -f /usr/bin/python`)
  exec(`ln -s /usr/bin/python2.7 /usr/bin/python`)
  console.log(chalk.green.bold('[INFO]'), 'Make Symbolic link. Ready to use python');
}





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

  function installPackage(i, package, installDir, ip, opt){
   switch(package){
     case 'java' :
     var mirror1 = 'https://files-cdn.liferay.com/mirrors/download.oracle.com/otn-pub/java/jdk/8u121-b13/jdk-8u121-linux-x64.tar.gz'
     console.log(chalk.green.bold('[INFO]'), 'waiting for download java build ... It takes about 20 min');
       // exec(`ssh root@${i} wget https://download.java.net/openjdk/jdk8u41/ri/openjdk-8u41-b04-linux-x64-14_jan_2020.tar.gz ${installDir}${package}`)
       // console.log('i1===>', i);
       // console.log('ip[0]===>', ip[0]);
       // console.log('ip[1]===>', ip[1]);
      if(i == property.get_server_IP()) {
        // console.log('???1');
       exec(`wget ${mirror1} -P ${installDir}${package}`)
       exec(`tar -xvf ${installDir}${package}/jdk-8u121-linux-x64.tar.gz -C ${installDir}${package}`)
        exec(`./envSet.sh JAVA_HOME ${installDir}${package}/jdk1.8.0_121`)
        //exec(`echo 'export JAVA_HOME=${installDir}${package}/jdk1.8.0_121' >> /etc/profile`)
        //exec(`echo 'export PATH=$PATH:$JAVA_HOME/bin' >> /etc/profile`)
        //exec(`source /etc/profile`)
      }
      else{
        // console.log('???2');
        // console.log('i2===>', i);
        // console.log('node!');
        exec(`scp -r ${installDir}${package}/jdk1.8.0_121 root@${i}:${installDir}${package}/`)
        exec(`scp -r /etc/profile root@${i}:/etc/profile`)
      }
      console.log(chalk.green.bold('[INFO]'), 'complete');
      //tar파일 압축 해제 해야 함..
       break;
     case 'python' :
       makePythonLink(i);
       break;
     case 'maven' :
       makeMavenHome(i)
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




function installDatabase(db, nodes, node_arr){
    // console.log('node정보 : ', node_arr);
    // console.log('node_homedir:', node_homedir);
    node_arr.forEach(i=>{
      exec(`scp -r killShell root@${i}:/${node_homedir}`)
    })

    switch(db){
      //노드에 설치
        case 'cassandra' :
  	       var dir = property.get_server_cassandra_dir()
  	       var node_dir = property.get_node_cassandra_dir()
           var server_cassandra_dir = property.get_server_cassandra_dir()
           var cassandraHome = `${server_cassandra_dir}/cassandra`
           var conf = `${cassandraHome}/conf/cassandra.yaml`
    	     var update_conf = property.get_update_conf_path()
        	 var exists = fs.existsSync(`${conf}`);
                if(exists==true){
                 cassandraAction.cassandraSetClusterEnv(conf, nodes);
                 // console.log('nodes:', nodes);
                 console.log(chalk.green.bold('[INFO]'), 'cassandra Set Cluster Environments');
              	}else{
                  console.log(chalk.red.bold('[Error]'), 'conf file not found');
                  break;
                }
          cassandraAction.cassandraCopy(nodes, node_arr, cassandraHome, node_dir, conf, update_conf);
  	      console.log(chalk.green.bold('[INFO]'), 'cassandra Installed');
          break;

        case 'arangodb' :
          node_arr.forEach(i=>{
            console.log(chalk.green.bold('[INFO]'), 'Check if ArangoDB is installed in', chalk.blue.bold(i));
            try{
              stdout = exec(`ssh root@${i} "rpm -qa|grep arango"`).toString();
              if(stdout!=null){
                console.log(chalk.green.bold('[INFO]'),'ArangoDB is already installed in', chalk.blue.bold(i));
                console.log('----------------------------------------------------------');
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
          })
        break;

        case 'orientdb' :
          //노드에 설치하기 위해 서버에서 미리 orientdb 만들어놓고 보낸 후 수정
          ip = property.get_nodes_IP().split(',');
          //서버에 있는거 installConfig 값 읽어와서 sed로 변경한 뒤 노드로 배포
          //변경할 파일
          //1. bin/orientdb.sh
          //2. config/hazelcast.xml
          //3. config/default-distributed-db-config.json

          let fixDir_cmd1 = `sed -i 11c'ORIENTDB_DIR="orientdb"' ${server_homedir}/orientdb/bin/orientdb.sh`
          let fixDir_cmd2 = `sed -i "10,11s|orientdb|"${node_homedir}/orientdb"|" ${server_homedir}/orientdb/bin/orientdb.sh`
          exec(fixDir_cmd1)
          exec(fixDir_cmd2)
          console.log(chalk.green.bold('[INFO]'), 'fix bin/orientdb.sh complete!');

          let line1 = 43
          let line2 = 11

          ip.forEach(i=>{
            console.log('i is ', i);
            let hazel_cmd = `sed -i ${line1}c'<member>${i}</member>' ${server_homedir}/orientdb/config/hazelcast.xml`
            exec(hazel_cmd)
            console.log(chalk.green.bold('[INFO]'), 'fix config/hazelcast.xml complete!');
            let fixdistributed_cmd
            if(i==ip[0]){
              fixdistributed_cmd = `sed -i 11c'"orientdb${i.slice(11)}": "master",' ${server_homedir}/orientdb/config/default-distributed-db-config.json`
            }else{
              fixdistributed_cmd = `sed -i ${line2}c'"orientdb${i.slice(11)}": "replica",' ${server_homedir}/orientdb/config/default-distributed-db-config.json`
            }
            exec(fixdistributed_cmd)
            console.log(chalk.green.bold('[INFO]'), 'fix config/default-distributed-db-config.json complete!');
            line1++;
            line2++;
          })
          console.log('----------------------------------------------------------');

          // let hazel_cmd1 = `sed -i 43c'<member>${ip[0]}</member>' ${server_homedir}/orientdb/config/hazelcast.xml`
          // let hazel_cmd2 = `sed -i 44c'<member>${ip[1]}</member>' ${server_homedir}/orientdb/config/hazelcast.xml`
          // let hazel_cmd3 = `sed -i 45c'<member>${ip[2]}</member>' ${server_homedir}/orientdb/config/hazelcast.xml`


          // let fixdistributed_cmd1 = `sed -i 11c'"orientdb${ip[0].slice(11)}": "master",' ${server_homedir}/orientdb/config/default-distributed-db-config.json`
          // let fixdistributed_cmd2 = `sed -i 12c'"orientdb${ip[1].slice(11)}": "replica",' ${server_homedir}/orientdb/config/default-distributed-db-config.json`
          // let fixdistributed_cmd3 = `sed -i 13c'"orientdb${ip[2].slice(11)}": "replica"' ${server_homedir}/orientdb/config/default-distributed-db-config.json`


          // exec(hazel_cmd1)
          // exec(hazel_cmd2)
          // exec(hazel_cmd3)
          // console.log(chalk.green.bold('[INFO]'), 'fix config/hazelcast.xml complete!');
          // exec(fixdistributed_cmd1)
          // exec(fixdistributed_cmd2)
          // exec(fixdistributed_cmd3)
          // console.log(chalk.green.bold('[INFO]'), 'fix config/default-distributed-db-config.json complete!');

  		    ip.forEach(i=>{
              dirnum = i.split('.');
              let homeNum = "orientdb"+dirnum[dirnum.length-1]
              // console.log('homeNum :', homeNum);

              startTime = getTime();

              try{
                let checkdir_cmd = `ssh root@${i} ls -l ${node_homedir}/${homeNum}`
                let dir1 = exec(checkdir_cmd);
                //파일이 이미 존재 => 재실행임
                console.log(chalk.yellow.bold('[WARNING]'), 'Already installed in', chalk.blue.bold(i));
              }catch(error){
                //없으면 No such file or directory
                //존재하지 않음 => 최초 실행
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
              }
            console.log('----------------------------------------------------------');
            })
          break;
     }
  }


  function installTool(tool){
    console.log('tool :', tool);
    console.log(chalk.green.bold('[INFO]'), 'Installation', chalk.blue.bold(tool), 'into IP address', chalk.blue.bold(i));
  }
