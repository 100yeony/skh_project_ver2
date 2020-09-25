const PropertiesReader = require('properties-reader');
const property = require('../../propertiesReader.js')
const chalk = require('chalk')
const exec = require('child_process').exec
const spawn = require('child_process').spawn
const fs = require('fs')
const workload_dir = property.get_server_file2_dir() // Graph/workloads
const result_dir = property.get_server_file3_dir() // Graph/result
const server_homedir = property.get_server_homedir()
const node_homedir = property.get_node_homedir()
const IO_tracer_dir = property.get_IO_tracer_dir()
const IO_watch_dir = property.get_IO_watch_dir()
const IO_output_dir = property.get_IO_output_dir()
const IO_driverManager_dir = property.get_IO_driverManager_dir()
const orientMaster_IP = property.get_orientMaster_IP()
const nosqltests_result_dir = property.get_nosqltests_result_dir()
let status = -1 //켜져있을 때 1, 꺼져있을 때 -1, stderr일때 0
let status2 = -1 //켜져있을 때 1, 꺼져있을 때 -1, stderr일때 0
let complete_vertex = -1
let complete_edge = -1
const server_IP = property.get_server_IP()
const nodes_IP = property.get_nodes_IP()
let nodeIPArr = nodes_IP.split(',')
let nodeIPcount = nodeIPArr.length
let nodetool_ip = property.get_nodetool_IP()


module.exports.graphbench = (opt) => {
  exec(`mkdir ${nosqltests_result_dir}`)

  benchmark_name(opt)
  main(status, nodeIPArr, nodetool_ip, opt)


 async function main(status, nodeIPArr, nodetool_ip, opt){
   // check_NosqlTests(status, opt)
   let flag = await check_NosqlTests(status, opt)
   // console.log('flag: ', flag);
   if(flag == 1){ //status = 1
     dbstart()
     setTimeout(function() {
       checkStatus_Orientdb(status, nodeIPArr, nodetool_ip, opt)
     }, 10000);
   }
}
}


 async function runOrientBench(status, opt){
   if (opt.iotracer == true) { // IOracer 옵션이 있을 경우Otracer 를 실행함
     let timewindow_iotracer = opt.time/1000
     nodeIPArr.forEach((ip) => {
       try {
         runcmd = `ssh root@${ip} ${IO_tracer_dir}/bin/iotracer -m ${IO_driverManager_dir} ${IO_watch_dir} -i ${timewindow_iotracer} -o ${IO_output_dir}/${opt.bmname}`

         runcmdexec = spawn(runcmd, null, {
           shell: true
         });

         console.log('----------------------------------------------------------');
         console.log(chalk.green.bold('[INFO]'), 'run iotracer : ', chalk.blue.bold(ip));
         // console.log('RUNCMD', runcmd)
         console.log('----------------------------------------------------------');

       } catch (err) {
         console.log(err);
       }
     })
     }
   if(opt.runtype == 'load'){
     let complete_vertex = await load_vertex(status2, opt)
     // console.log('COMPLETE_VERTEX', complete_vertex)
     if(complete_vertex == 1){
       let complete_edge = await load_edge(status2, opt)
       // console.log('COMPLETE_EDGE', complete_edge)
     }
   }else if (opt.runtype == 'run'){
     run_NosqlTests(status2, opt)
   }else if (opt.runtype == 'loadrun'){
     complete_vertex = await load_vertex(status2, opt)
     // console.log('COMPLETE_VERTEX', complete_vertex)
     if(complete_vertex == 1){
       complete_edge = await load_edge(status2, opt)
       // console.log('COMPLETE_EDGE', complete_edge)
     }
     if(complete_vertex == 1 && complete_edge == 1){
       run_NosqlTests(status2, opt)
     }
   }
 }

  function dbstart(){
    return new Promise(function(resolve, reject) {
    nodeIPArr.forEach((ip) => {
      dirnum = ip.split('.');
      let runcmd = `ssh root@${ip} ${node_homedir}/orientdb${dirnum[dirnum.length-1]}/bin/dserver.sh &`
      exec(runcmd)
      console.log('----------------------------------------------------------');
      console.log(chalk.green.bold('[INFO]'), 'run orientdb in', `${ip}`);
      // console.log('RUNCMD', runcmd)
      console.log('----------------------------------------------------------');
    });
   });
  }

  function checkStatus_Orientdb(status, nodeIPArr, nodetool_ip, opt) {
      let checkcmd = `curl --user root:1234 --header "Accept: text/csv" -d "HA STATUS -servers -output=text" "http://${nodetool_ip}:2480/command/skh/sql"`
      // console.log('CHECKCMD', checkcmd)
      cmdexec = exec(checkcmd)
      cmdexec.stderr.on('data', function(data) {
        // console.log('stderr', data)
        if(data.includes('Failed')){
        setTimeout(function() {
          checkStatus_Orientdb(status, nodeIPArr, nodetool_ip, opt)
        }, 20000);
        }
      });
      cmdexec.stdout.on('data', function(data) {
        a1 = data.toString().match(/ONLINE/gi);
        if(a1!=null){
          console.log(data);
          if(a1.length==nodeIPcount*2){
            a = a1.length;
           console.log(chalk.green.bold('[INFO]'), 'orientdb status complete! ONLINE:', a);
           runOrientBench(status, opt)
          } else {
            console.log('----------------------------------------------------------');
            console.log(chalk.red.bold('[ERROR]'), 'check orientdb again .. waiting for 20 seconds');
            console.log('----------------------------------------------------------');
            setTimeout(function() {
              checkStatus_Orientdb(status, nodeIPArr, nodetool_ip, opt)
            }, 20000);
          }
        }else {
          console.log('----------------------------------------------------------');
          console.log(chalk.red.bold('[ERROR]'), 'check orientdb again .. waiting for 20 seconds');
          console.log('----------------------------------------------------------');
          setTimeout(function() {
            checkStatus_Orientdb(status, nodeIPArr, nodetool_ip, opt)
          }, 20000);
        }
      });
  }


    async function check_NosqlTests(status, opt) {
      // let orientdb_status = await checkStatus_Orientdb(status, nodeIPArr, nodetool_ip) //1, -1
      // console.log('ORIENTDB_STATUS', orientdb_status)
      let iotracer_status = await checkStatus_iotracer(status, opt.iotracer)
      // console.log('IOTRACER_STATUS', iotracer_status)
      let runtype_status = await checkStatus_runtype(status, opt.runtype)
      // console.log('RUNTYPE_STATUS', runtype_status)
      let name_status = await checkStatus_name(status, opt.name)
      // console.log('NAME', name_status)
      let time_status = await checkStatus_time(status, opt.time)
      // console.log('TIME', time_status)
      let size_status = await checkStatus_size(status, opt.size)
      // console.log('SIZE', size_status)

        if (iotracer_status == 1 && runtype_status == 1 && name_status == 1 && time_status == 1 && size_status == 1) {
          return status = status*-1 //모두 잘 켜졌을 때 status = 1
        }else {
          console.log('----------------------------------------------------------');
          console.log(chalk.red.bold('[ERROR]'), 'There was an error and could not be executed.')
          console.log('----------------------------------------------------------');
          return status   //하나라도 에러가 나면 status = -1
        }
    }


function checkStatus_iotracer(status, iotracer) {
  return new Promise(function(resolve, reject) {
    if (iotracer == true) {
      iotracing = 'true'
      console.log('----------------------------------------------------------');
      console.log(chalk.green.bold('[INFO]'), 'iotracer :', chalk.blue.bold(iotracing));
      // console.log('----------------------------------------------------------');
    } else {
      iotracing = 'false'
      console.log('----------------------------------------------------------');
      console.log(chalk.green.bold('[INFO]'), 'iotracer :', chalk.blue.bold(iotracing));
      // console.log('----------------------------------------------------------');
    }
    return resolve(status * -1)
  });
}

function get_IO_results(bmname, nodeIPArr, runtype) {
  nodeIPArr.forEach((ip) => { // iotracer 종료 후
    try {
      let killcmd = `ssh root@${ip} sh ${node_homedir}/killShell/killIO.sh`
      killexec = exec(`ssh root@${ip} ${node_homedir}/killShell/killIO.sh`)

      console.log('----------------------------------------------------------');
      console.log(chalk.green.bold('[INFO]'), 'kill iotracer : ', chalk.blue.bold(ip));
      // console.log('KILLCMD', killcmd)
      // console.log('----------------------------------------------------------');
    } catch (err) {
      console.log('kill fail');
      console.log(err);
    }
  })
}

function checkStatus_runtype(status, runtype) {
  return new Promise(function(resolve, reject) {
    if (runtype == 'load' || runtype == 'run' || runtype == 'loadrun') {
      console.log('----------------------------------------------------------');
      console.log(chalk.green.bold('[INFO]'), 'runtype :', chalk.blue.bold(runtype));
      // console.log('----------------------------------------------------------');
      return resolve(status * -1)
    } else {
      console.log('----------------------------------------------------------');
      console.log(chalk.red.bold('[ERROR]'), 'runtype :', 'invalid runtype', chalk.blue.bold(runtype), `, (choose from 'load', 'run', 'loadrun')`)
      // console.log('----------------------------------------------------------');
      return resolve(status * 1)
    }
  });
}


function checkStatus_name(status, name) {
  return new Promise(function(resolve, reject) {
    let file = `./${workload_dir}${name}`
    // console.log('FILE', file)
    try {
      fs.statSync(file);
      console.log('----------------------------------------------------------');
      console.log(chalk.green.bold('[INFO]'), 'workload file :', chalk.blue.bold(name));
      // console.log('----------------------------------------------------------');
      return resolve(status * -1) //success : 1
    } catch (err) {
      // console.error(err);
      console.log('----------------------------------------------------------');
      console.log(chalk.red.bold('[ERROR]'), 'workload name :', 'invalid workload file', `'${name}'`)
      // console.log('----------------------------------------------------------');
      return resolve(status) //fail : -1
    }
  });
}

function isNumber(s) { // 입력이 숫자인지 확인해주는 함수
  s += ''; // 문자열로 변환
  s = s.replace(/^\s*|\s*$/g, ''); // 좌우 공백 제거
  if (s == '' || isNaN(s)) return false;
  return true;
}

function checkStatus_time(status, time) {
  return new Promise(function(resolve, reject) {
    if(time == null){
      time = 10000
      console.log('----------------------------------------------------------');
      console.log(chalk.green.bold('[INFO]'), 'settime :', chalk.blue.bold(time),'(ms)');
      // console.log('----------------------------------------------------------');
      return resolve(status * -1) //success : 1
    }else{
      if (isNumber(time)) { // 입력이 숫자
        console.log('----------------------------------------------------------');
        console.log(chalk.green.bold('[INFO]'), 'settime :', chalk.blue.bold(time),'(ms)');
        // console.log('----------------------------------------------------------');
        return resolve(status * -1) //success : 1
      } else { // 입력이 숫자가 아님
        console.log('----------------------------------------------------------');
        console.log(chalk.red.bold('[ERROR]'), 'settime :', `enter time as number type.`)
        // console.log('----------------------------------------------------------');
        return resolve(status) //fail : -1
      }

    }

  });
}

function checkStatus_size(status, size) {
  return new Promise(function(resolve, reject) {
    let list = ["LDBC1", "LDBC2", "LDBC3", "LDBC4", "LDBC5", "LDBC6", "LDBC7", "pokec", "livejournal"]
    if (list.includes(size)) { // size : LDBC, pocket, livejournal
      console.log('----------------------------------------------------------');
      console.log(chalk.green.bold('[INFO]'), 'size :', chalk.blue.bold(size));
      console.log('----------------------------------------------------------');
      return resolve(status * -1) //success : 1
    } else { // 입력이 숫자가 아님
      console.log('----------------------------------------------------------');
      console.log(chalk.red.bold('[ERROR]'), 'size :', 'invalid size', `'${size}'.`, `enter ${list}`)
      console.log('----------------------------------------------------------');
      return resolve(status) //fail : -1
    }
  });
}

function load_vertex(status2, opt) {
  return new Promise(function(resolve, reject) {

    let fileSize = "";

    switch (opt.size) {
      case "LDBC1":
        fileSize = "sf0.1";
        break;
      case "LDBC2":
        fileSize = "sf0.3";
        break;
      case "LDBC3":
        fileSize = "sf1";
        break;
      case 'LDBC4':
        fileSize = "sf3";
        break;
      case 'LDBC5':
        fileSize = "sf10";
        break;
      case 'LDBC6':
        fileSize = "sf30";
        break;
      case 'LDBC7':
        fileSize = "sf100";
        break;
    }
    let nodeIP = property.get_nodetool_IP();

    if(opt.size == "pokec"){
      let pokecP_cmd1 = `sed -i 7c'  "path": "${server_homedir}/orientdb/person/soc-pokec-profiles-orientdb.txt",' ${server_homedir}/orientdb/bin/pokecP.json`
      let pokecP_cmd2 = `sed -i 19c'     "dbURL": "remote:${nodeIP}/skh",' ${server_homedir}/orientdb/bin/pokecP.json`
      let pokecR_cmd1 = `sed -i 7c'  "path": "${server_homedir}/orientdb/person/soc-pokec-relationships-orientdb.txt",' ${server_homedir}/orientdb/bin/pokecR.json`
      let pokecR_cmd2 = `sed -i 28c'      "dbURL": "remote:${nodeIP}/skh",' ${server_homedir}/orientdb/bin/pokecR.json`
      exec(pokecP_cmd1)
      exec(pokecP_cmd2)
      exec(pokecR_cmd1)
      exec(pokecR_cmd2)
    }else if(opt.size == "livejournal"){
      let journalP_cmd1 = `sed -i 7c' "path": "${server_homedir}/orientdb/person/journalP",' ${server_homedir}/orientdb/bin/journalP.json`
      let journalP_cmd2 = `sed -i 19c'     "dbURL": "remote:${nodeIP}/skh",' ${server_homedir}/orientdb/bin/journalP.json`
      let journalR_cmd1 = `sed -i 5c' "source": { "file": { "path": "${server_homedir}/orientdb/person/soc-LiveJournal1.txt" } },' ${server_homedir}/orientdb/bin/journalR.json`
      let journalR_cmd2 = `sed -i 32c'      "dbURL": "remote:${nodeIP}/skh",' ${server_homedir}/orientdb/bin/journalR.json`
      exec(journalP_cmd1)
      exec(journalP_cmd2)
      exec(journalR_cmd1)
      exec(journalR_cmd2)
    }else{
      let LDBCP_cmd1 = `sed -i 5c' "source": { "file": { "path": "${server_homedir}/orientdb/person/${fileSize}/person_0_0.csv"  } },' ${server_homedir}/orientdb/bin/LDBCP.json`
      let LDBCP_cmd2 = `sed -i 18c'      "dbURL": "remote:${nodeIP}/skh",' ${server_homedir}/orientdb/bin/LDBCP.json`
      let LDBCR_cmd1 = `sed -i 5c' "source": { "file": { "path": "${server_homedir}/orientdb/person/${fileSize}/person_knows_person_0_0.csv" } },' ${server_homedir}/orientdb/bin/LDBCR.json`
      let LDBCR_cmd2 = `sed -i 36c'      "dbURL": "remote:${nodeIP}/skh",' ${server_homedir}/orientdb/bin/LDBCR.json`
      exec(LDBCP_cmd1)
      exec(LDBCP_cmd2)
      exec(LDBCR_cmd1)
      exec(LDBCR_cmd2)
    }

    dirnum = orientMaster_IP.split('.')
    let oetl_name = ''
    if(opt.size == "pokec"){
      oetl_name = 'pokecP.json'
    }else if(opt.size == "livejournal"){
      oetl_name = 'journalP.json'
    }else{
      oetl_name = 'LDBCP.json'
    }

    let load_vertex_cmd = `${server_homedir}/orientdb/bin/oetl.sh ${oetl_name}`
    try{
      const load_vertex_exec = exec(load_vertex_cmd)
      console.log('----------------------------------------------------------');
      console.log(chalk.green.bold('[INFO]'), 'load vertex : ', chalk.blue.bold(oetl_name));
      // console.log('LOAD_VERTEX_CMD', load_vertex_cmd)
      console.log('----------------------------------------------------------');

      load_vertex_exec.stdout.on('data', function(data){
        console.log(data);
        // resolve(status * -1)
      })

      load_vertex_exec.stderr.on('data', function(data){
        console.log(data);
        // resolve(status)
      })

      load_vertex_exec.on('exit', function(code){
        console.log('----------------------------------------------------------');
        console.log(chalk.green.bold('[INFO]'), `load vertex completed.`);
        console.log('----------------------------------------------------------');
        resolve(status2 * -1)
      })

    } catch(err){
      console.log(err)
      resolve(status2)
    }
  });
}

function load_edge(status2, opt) {
  return new Promise(function(resolve, reject) {
    dirnum = orientMaster_IP.split('.')

    let oetl_name = ''
    if(opt.size == "pokec"){
      oetl_name = 'pokecR.json'
    }else if(opt.size == "livejournal"){
      oetl_name = 'journalR.json'
    }else{
      oetl_name = 'LDBCR.json'
    }

    let load_edge_cmd = `${server_homedir}/orientdb/bin/oetl.sh ${oetl_name}`
    try{
      const load_edge_exec = exec(load_edge_cmd)
      console.log('----------------------------------------------------------');
      console.log(chalk.green.bold('[INFO]'), 'load edge : ', chalk.blue.bold(oetl_name));
      // console.log('LOAD_EDGE_CMD', load_edge_cmd)
      console.log('----------------------------------------------------------');

      load_edge_exec.stdout.on('data', function(data){
        console.log(data);
      })
      load_edge_exec.stderr.on('data', function(data){
        console.log(data);
      })
      load_edge_exec.on('exit', function(code){
        console.log('----------------------------------------------------------');
        console.log(chalk.green.bold('[INFO]'), `load edge completed.`);
        console.log('----------------------------------------------------------');
        resolve(status2 * -1)

        if(opt.runtype == 'load'){
          nodeIPArr.forEach((ip) => {
            try {
              dirnum = ip.split('.');
              let kill_cmd = `ssh root@${ip} ${node_homedir}/killShell/killOrient.sh`
              let kill_exec = exec(kill_cmd)
              console.log('----------------------------------------------------------');
              console.log(chalk.green.bold('[INFO]'), 'orientdb kill : ', chalk.blue.bold(ip));
              console.log('KILL_CMD', kill_cmd)
              // console.log('----------------------------------------------------------');
            } catch (err) {
              console.log(err);
            }
          })

          if (opt.iotracer == true) { // 벤치마킹 종료 후 iotracer 결과를 저장함
              get_IO_results(opt.bmname, nodeIPArr, opt.runtype)

              setTimeout(function() {
                nodeIPArr.forEach((ip) => {
                  let result_cmd = `ssh root@${ip} ${IO_tracer_dir}/result.sh ${IO_output_dir}/${opt.bmname} ${server_IP} ${nosqltests_result_dir}/${opt.bmname}/${ip}_${opt.runtype}_output`
                  try {
                    // 파싱 결과를 서버의 benchmark name 디렉토리에 저장함
                    let result_exec = exec(result_cmd)
                    // result_exec.stdout.on('data', function(data) {
                    //   console.log(data);
                    // })
                  } catch (err) {
                    console.log('----------------------------------------------------------');
                    console.log(chalk.red.bold('[ERROR]'), `Failed to send iotracer data node to server.`);
                    console.log('----------------------------------------------------------');
                    console.log(err);
                  }
                })
              }, 20000);
          }
          console.log('----------------------------------------------------------');
          console.log(chalk.green.bold('[INFO]'), 'complete benchmarking : ', chalk.blue.bold(opt.bmname));
          console.log('----------------------------------------------------------');
          let iotracer_status =  checkStatus_iotracer(status, opt.iotracer)
          // console.log('IOTRACER_STATUS', iotracer_status)
          let runtype_status =  checkStatus_runtype(status, opt.runtype)
          // console.log('RUNTYPE_STATUS', runtype_status)
          let name_status =  checkStatus_name(status, opt.name)
          // console.log('NAME', name_status)
          let time_status =  checkStatus_time(status, opt.time)
          // console.log('TIME', time_status)
          let size_status =  checkStatus_size(status, opt.size)
        }
      })

    } catch(err){
      console.log(err)
      resolve(status2)
    }
  });
}

function run_NosqlTests(status2, opt) {
  return new Promise(function(resolve, reject) {
    dirnum = orientMaster_IP.split('.')
    let run_cmd = `nosqltest orientdb -n ${opt.name} -t ${opt.time} -s ${opt.size}`
    console.log('RUN_CMD', run_cmd)
        try {
          runexec = exec(run_cmd)
          console.log('----------------------------------------------------------');
          console.log(chalk.green.bold('[INFO]'), `nosqltests started.`);
          console.log('----------------------------------------------------------');
        }catch (err){
          console.error(err);
        }

          runexec.stdout.on('data', function(data){
            console.log(data);
          })


          runexec.stderr.on('data', function(data){
            console.log(data);
          })

          runexec.on('exit', function(data){
            console.log('----------------------------------------------------------');
            console.log(chalk.green.bold('[INFO]'), `nosqltests completed.`);
            console.log('----------------------------------------------------------');
            try {
              // /home/skh/nosqltests_result/
              let mvCmd = `mv ${server_homedir}/Graph/result/ ${nosqltests_result_dir}/${opt.bmname}/`
              exec(mvCmd)
              exec(`mkdir ${server_homedir}/Graph/result`)
              // console.log(mvCmd);
              console.log('----------------------------------------------------------');
              console.log(chalk.green.bold('[INFO]'), `move result file completed.`);
              console.log('----------------------------------------------------------');
            } catch (err) {
              console.log(err);
            }

              nodeIPArr.forEach((ip) => {
                try {
                  dirnum = ip.split('.');
                  const std = exec(`ssh root@${ip} ${node_homedir}/killShell/killOrient.sh`);
                  console.log('----------------------------------------------------------');
                  console.log(chalk.green.bold('[INFO]'), 'orientdb kill : ', chalk.blue.bold(ip));
                  // console.log('----------------------------------------------------------');
                } catch (err) {
                  console.log(err);
                }
              })

              if (opt.iotracer == true) { // 벤치마킹 종료 후 iotracer 결과를 저장함
                  get_IO_results(opt.bmname, nodeIPArr, opt.runtype)

                  setTimeout(function() {
                    nodeIPArr.forEach((ip) => {
                      let result_cmd = `ssh root@${ip} ${IO_tracer_dir}/result.sh ${IO_output_dir}/${opt.bmname} ${server_IP} ${nosqltests_result_dir}/${opt.bmname}/${ip}_${opt.runtype}_output`
                      try {
                        // 파싱 결과를 서버의 benchmark name 디렉토리에 저장함
                        let result_exec = exec(result_cmd)
                        // result_exec.stdout.on('data', function(data) {
                        //   console.log(data);
                        // })
                      } catch (err) {
                        console.log('----------------------------------------------------------');
                        console.log(chalk.red.bold('[ERROR]'), `Failed to send iotracer data node to server.`);
                        console.log('----------------------------------------------------------');
                        console.log(err);
                      }
                    })
                  }, 20000);
              }

              console.log('----------------------------------------------------------');
              console.log(chalk.green.bold('[INFO]'), 'complete benchmarking : ', chalk.blue.bold(opt.bmname));
              console.log('----------------------------------------------------------');
              let iotracer_status =  checkStatus_iotracer(status, opt.iotracer)
              // console.log('IOTRACER_STATUS', iotracer_status)
              let runtype_status =  checkStatus_runtype(status, opt.runtype)
              // console.log('RUNTYPE_STATUS', runtype_status)
              let name_status =  checkStatus_name(status, opt.name)
              // console.log('NAME', name_status)
              let time_status =  checkStatus_time(status, opt.time)
              // console.log('TIME', time_status)
              let size_status =  checkStatus_size(status, opt.size)

        resolve(status2 * -1)
      })
  });
}

function benchmark_name(opt) {
  if (opt.bmname == null) { // n 값이 없으면 디폴트값 만들어줌
    opt.bmname = 'nosqltests_result_1'
    try {
      while (1) {
        let file = `${nosqltests_result_dir}/${opt.bmname}`
        fs.statSync(file); // 파일 존재 확인

        let string = opt.bmname
        let strArray = string.split('_') // 마지막 sequence 자르기
        let seqString = strArray[strArray.length - 1] // 마지막 인자 (숫자 저장)

        // 배열에 담기 (스트링->각 요소들을 숫자로)
        let seqArray = new Array();
        let newArray = new Array();
        seqArray = seqString.split("");

        let seqNum = 0
        // 각 요소들을 더해서 숫자로 계산
        for (let i = 0; i < seqArray.length; i++) {
          newArray[i] = seqArray[i] * Math.pow(10, seqArray.length - 1 - i)
          newArray[seqArray.length - 1] = newArray[seqArray.length - 1] + 1
          seqNum += newArray[i]
        }
        opt.bmname = `nosqltests_result_${seqNum}`
      }
    } catch (err) {
      // console.log(err);
    }
  } else { //n 값이 있으면 else if((typeof opt.name) == 'string')
    const path = `${nosqltests_result_dir}`
    let file = opt.bmname
    // console.log(file);
    //console.log(file.split("_")[1])
    //split 하면 배열로 반환됨
    const fs = require('fs')

    while (1) {
      // console.log(file)
      let array = file.split("_") //som, som, 1
      try {
        if (!fs.existsSync(path + '/' + file)) {
          fs.mkdirSync(path + '/' + file)
        } else if (fs.existsSync(path + '/' + file) && array.length >= 2) {
          let num = Number(array[array.length - 1]); //
          // console.log('exists')
          if (isNaN(num)) {
            file = file + '_' + 1
            fs.mkdirSync(path + '/' + file)

            opt.bmname = file
          } else if (typeof(num) == typeof(10)) {
            num += 1; //2
            //for문
            file = ''
            for (i = 0; i < array.length - 1; i++) { //length = 3
              file += array[i] + '_' //i = 0, 1 (som, som)
            }
            file = file + num
            fs.mkdirSync(path + '/' + file)
            //opt.name = file
            opt.bmname = file
          } else {
            file = file + '_' + 1 //som_som_1
            fs.mkdirSync(path + '/' + file)
            //opt.name = file
            opt.bmname = file
          }
          break;
        } else if (array.length == 1) {
          file = array[0] + '_' + 1
          fs.mkdirSync(path + '/' + file)

          opt.bmname = file
        }
        break;
      } catch (err) {
        continue;
      }
    }
  }
  console.log('----------------------------------------------------------');
  console.log(chalk.green.bold('[INFO]'), 'benchmark Name :', chalk.blue.bold(opt.bmname));
  console.log('----------------------------------------------------------');

  try {
    exec(`mkdir ${nosqltests_result_dir}/${opt.bmname}`)
  } catch (err) {
    console.error(err);
  }
}
