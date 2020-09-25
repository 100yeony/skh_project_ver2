const program = require('commander')
const property = require('../../propertiesReader.js')
const PropertiesReader = require('properties-reader')
const exec = require('child_process').exec
const execSync = require('child_process').execSync
const spawn = require('child_process').spawn
const fs = require('fs')
const chalk = require('chalk')
let Promise = require('promise')
const server_IP = property.get_server_IP()
const nodes_IP = property.get_nodes_IP()
let nodeIPArr = nodes_IP.split(',')
let nodeIPcount = nodeIPArr.length
let nodetool_ip = property.get_nodetool_IP()
const ycsb_exporter = property.get_ycsb_exporter()
const ycsb_exportfile_dir = property.get_ycsb_exportfile_dir()
const IO_tracer_dir = property.get_IO_tracer_dir()
const IO_watch_dir = property.get_IO_watch_dir()
const server_homedir = property.get_server_homedir()
const node_homedir = property.get_node_homedir()
const IO_output_dir = property.get_IO_output_dir()
const IO_driverManager_dir = property.get_IO_driverManager_dir()
const node_cassandra_dir = property.get_node_cassandra_dir()
const node_arangodb_dir = property.get_node_arangodb_dir()
const node_arangodb_data_dir = property.get_node_arangodb_data_dir()


let loadsizeCmd = '',
  recordcount = '',
  operationcount = ''


/* ################################################################################################################# */
/* ################################################################################################################# */

let status = -1 //켜져있을 때 1, 꺼져있을 때 -1, stderr일때 0

function runCassExec(status, nodeIPArr, nodetool_ip) {
  return new Promise(function(resolve, reject) {
    nodeIPArr.forEach(function(ip) {
      let firewallcmd = `ssh root@${ip} systemctl stop firewalld`

      let runcmd = `ssh root@${ip} ${node_cassandra_dir}/bin/cassandra -R`
      console.log('RUNCMD', runcmd)
      console.log('----------------------------------------------------------');
      console.log(chalk.green.bold('[INFO]'), 'IP address', chalk.blue.bold(ip));
      exec(firewallcmd)
      console.log(chalk.green.bold('[INFO]'), 'stop firewall in', `${ip}`);
      exec(runcmd)
      console.log(chalk.green.bold('[INFO]'), 'run Cassandra in', `${ip}`);
    })
    console.log('----------------------------------------------------------');
    return console.log(chalk.green.bold('[INFO]'), 'run exec complete!');
  });
}

function stdout_results(status, nodeIPArr, nodetool_ip) {
  return new Promise(function(resolve, reject) {
    console.log('----------------------------------------------------------');
    console.log(chalk.green.bold('[INFO]'), 'check Node Status');

    // let statuscmd = `ssh root@${nodetool_ip} /root/ssdStorage/cassandra/bin/nodetool status`
    let statuscmd = `ssh root@${nodetool_ip} ${node_cassandra_dir}/bin/nodetool status`
    // console.log('STATUSCMD', statuscmd)
    let checkcmd = exec(statuscmd)

    let results = ''

    checkcmd.stdout.on('data', function(data) {
      results += data.toString()
    })

    checkcmd.on('exit', function(code) {
      //console.log('results : \n', results);
      return resolve(results)
    })

    checkcmd.stderr.on('data', function(data) {
      return resolve(status * 0)
    })

  });
}

function find_UN_DN(results) {
  return new Promise(function(resolve, reject) {
    let unTemp = 0
    let dnTemp = 0

    let unTemp1 = results.toString().match(/UN/gi)
    if (unTemp1 !== null) {
      unTemp = unTemp1.length
    }
    let dnTemp1 = results.toString().match(/DN/gi)
    if (dnTemp1 !== null) {
      dnTemp = dnTemp1.length
    }

    console.log(chalk.green.bold('[INFO]'), 'UN:', unTemp, ', DN:', dnTemp)
    if (unTemp == `${nodeIPcount}`) {
      return resolve(status * -1) //success : 1
    } else {
      return resolve(status) //fail : -1
    }
  });
}

/* ################################################################################################################# */
/* ################################################################################################################# */


function runArangoExec(status, nodeIPArr, nodetool_ip) {
  return new Promise(function(resolve, reject) {
    nodeIPArr.forEach(function(ip) {
      let firewallcmd = `ssh root@${ip} systemctl stop firewalld`

      let runcmd = `ssh root@${ip} arangodb --starter.mode=cluster --starter.data-dir=${node_arangodb_data_dir} --all.cluster.min-replication-factor=${nodeIPcount} --starter.join ${nodes_IP}`
      // console.log('RUNCMD', runcmd)

      console.log('----------------------------------------------------------');
      console.log(chalk.green.bold('[INFO]'), 'IP address', chalk.blue.bold(ip));
      exec(firewallcmd)
      console.log(chalk.green.bold('[INFO]'), 'stop firewall in', `${ip}`);
      exec(runcmd)
      console.log(chalk.green.bold('[INFO]'), 'run arangodb in', `${ip}`);
    })
    console.log('----------------------------------------------------------');
    return console.log(chalk.green.bold('[INFO]'), 'run exec complete!');
  });
}

function arango_status(status, nodetool_ip) {
  return new Promise(function(resolve, reject) {
    console.log('----------------------------------------------------------');
    console.log(chalk.green.bold('[INFO]'), 'IP address', chalk.blue.bold(nodetool_ip));
    console.log(chalk.green.bold('[INFO]'), 'check Node Status');


    const http = require("http");

    url = `http://${nodetool_ip}:8529/_admin/cluster/health`
    // console.log(url);
    http.get(url, res => {
      let data = "";
      let good = 0;
      res.on("data", chunk => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const parsedData = JSON.parse(data);
          if (parsedData.error) {
            throw new Error("Server replied with error code " + parsedData.code);
          }
          // console.log("Status: Node ID");
          for (node in parsedData.Health) {
            // console.log(parsedData.Health[node].Status + ": " + node);
            if (parsedData.Health[node].Status === 'good') {
              ++good;
            }
          }
          if (good = nodeIPcount*3) {
            console.log(chalk.green.bold('[INFO]'), 'Status is complete');
            return resolve(status * -1) //success : 1
          }
        } catch (err) {
          console.log(chalk.red.bold('[ERROR]'), + err.message);
          return resolve(status * 1)
        }
      });

      res.on("error", err => {
        console.log(chalk.red.bold('[ERROR]'), err.message);
        return resolve(status * 0)
      });
    });

  });
}


/* ################################################################################################################# */
/* ################################################################################################################# */

module.exports.ycsb = (opt) => {
  exec(`mkdir ${ycsb_exportfile_dir}`)

  benchmark_name(opt)
  run_function(status, opt)

  async function run_function(status, opt) {
    let iotracer_status = await check_iotracer(status, opt.iotracer)
    // console.log('IOTRACER_STATUS', iotracer_status)
    let dbtype_status = await check_dbtype(status, opt.dbtype, opt.casstracing)
    // console.log('DBTYPE_STATUS', dbtype_status)
    let runtype_status = await check_runtype(status, opt.runtype)
    // console.log('RUNTYPE_STATUS', runtype_status)
    let wlfile_status = await check_Fileexist(status, opt.wlfile)
    // console.log('WLFILE_STATUS', wlfile_status)
    let loadsize_status = await check_loadsize(status, opt.runtype, opt.loadsize)
    // console.log('LOADSIZE_STATUS', loadsize_status)
    let timewindow_status = await check_Timewindow(status, opt)
    // console.log('TIMEWINDOW_STATUS', timewindow_status)
    let threads_status = await check_threads(status, opt)
    // console.log('THREADS_STATUS', threads_status)

    if (dbtype_status == 1 && runtype_status == 1 && wlfile_status == 1 && loadsize_status == 1 && timewindow_status == 1 && threads_status == 1) {
      if (opt.dbtype == 'cassandra') {
        runCassExec(status, nodeIPArr, nodetool_ip)
        checkStatus_Cass(status, nodeIPArr, nodetool_ip)
      } else if (opt.dbtype == 'arangodb') {
        runArangoExec(status, nodeIPArr, nodetool_ip)
        // setTimeout(checkStatus_Arango, 1000 * 5, status, nodeIPArr, nodetool_ip)
        // checkStatus_Arango(status, nodeIPArr, nodetool_ip)
        setTimeout(function() {
          checkStatus_Arango(status, nodeIPArr, nodetool_ip)
        }, 10000);
      }
    } else {
      console.log('----------------------------------------------------------');
      console.log(chalk.red.bold('[ERROR]'), 'There was an error and could not be executed.')
      console.log('----------------------------------------------------------');
    }
  }

  async function checkStatus_Cass(status, nodeIPArr, nodetool_ip) {
    let resTemp = await stdout_results(status, nodeIPArr, nodetool_ip)
    // console.log('resTemp : ', resTemp);
    let isOK = await find_UN_DN(resTemp) //success: 1, failed: -1, stederr: 0
    console.log(chalk.green.bold('[INFO]'), 'Cassandra is OK? :', isOK, '(Success:1, Failed:-1)');
    if (isOK == 1) {
      console.log('----------------------------------------------------------');
      console.log(chalk.green.bold('[INFO]'), 'Start cassandra benchmark');
      console.log('----------------------------------------------------------');
      // runYCSB(opt, opt.runtype)

      if (opt.runtype == 'load' || opt.runtype == 'run') {
        opt.flag = true
        runYCSB(opt, opt.runtype)
      } else if (opt.runtype == 'loadrun') {
        let runtype1 = opt.runtype.substring(0, 4)
        let runtype2 = opt.runtype.substring(4, 7)

        // checkStatus_Cass
        opt.flag = true
        runYCSB(opt, runtype1)
          .then((data) => {
            opt.flag = data
            runYCSB(opt, runtype2)
          })

      } else {
        console.log('----------------------------------------------------------');
        console.log(chalk.red.bold('[ERROR]'), 'There was an error and could not be executed.')
        console.log('----------------------------------------------------------');
      }

    } else if (isOK == -1) {
      console.log('----------------------------------------------------------');
      console.log(chalk.red.bold('[ERROR]'), 'check cassandra again .. waiting for 20 seconds');
      setTimeout(checkStatus_Cass, 1000 * 20, status, nodeIPArr, nodetool_ip)
    } else if (isOK == 0) {
      console.log('----------------------------------------------------------');
      console.log(chalk.red.bold('[ERROR]'), 'stderr');
    }
  }


  async function checkStatus_Arango(status, nodeIPArr, nodetool_ip) {
    let isOK = await arango_status(status, nodetool_ip) //success: 1, failed: -1, stederr: 0
    // console.log(isOK);
    console.log(chalk.green.bold('[INFO]'), 'ArangoDB is OK? :', isOK, '(Success:1, Failed:-1)');
    if (isOK == 1) {
      console.log('----------------------------------------------------------');
      console.log(chalk.green.bold('[INFO]'), 'Start ArangoDB benchmark');
      console.log('----------------------------------------------------------');

      if (opt.runtype == 'load' || opt.runtype == 'run') {
        opt.flag = true
        runYCSB(opt, opt.runtype)
      } else if (opt.runtype == 'loadrun') {
        let runtype1 = opt.runtype.substring(0, 4)
        let runtype2 = opt.runtype.substring(4, 7)

        // checkStatus_Cass
        opt.flag = true
        runYCSB(opt, runtype1)
          .then((data) => {
            opt.flag = data
            runYCSB(opt, runtype2)
          })
      } else {
        console.log('----------------------------------------------------------');
        console.log(chalk.red.bold('[ERROR]'), 'There was an error and could not be executed.')
        console.log('----------------------------------------------------------');
      }

    } else if (isOK == -1) {
      console.log('----------------------------------------------------------');
      console.log(chalk.red.bold('[ERROR]'), 'check ArangoDB again .. waiting for 20 seconds');
      setTimeout(checkStatus_Arango, 1000 * 25, status, nodeIPArr, nodetool_ip)
    } else if (isOK == 0) {
      console.log('----------------------------------------------------------');
      console.log(chalk.red.bold('[ERROR]'), 'stderr');
    }
  }
}

/* ################################################################################################################# */
/* ################################################################################################################# */

const dropData = () => new Promise(resolve => {
  nodeIPArr.forEach((ip) => {
    dropCmd = `ssh root@${nodetool_ip} ${node_cassandra_dir}/bin/cqlsh -f ${node_cassandra_dir}/dropKeyspace.cql ${nodetool_ip}`
    // console.log('DROPCMD', dropCmd)
    try {
      const stdout = exec(dropCmd)
      console.log('----------------------------------------------------------');
      console.log(chalk.green.bold('[INFO]'), 'remove cassandra data : ', chalk.blue.bold(ip));
      // console.log('----------------------------------------------------------');
    } catch (err) {
      console.log(err)
    }
  })
  resolve()
})


const createData = () => new Promise(resolve => {
  createCmd = `${node_cassandra_dir}/bin/cqlsh -f ${node_cassandra_dir}/createKeyspace.cql ${nodetool_ip}`
  console.log('CREATECMD', createCmd)
  try {
    const stdout = exec(createCmd);
    console.log('----------------------------------------------------------');
    console.log(chalk.green.bold('[INFO]'), 'create cassandra table : ', chalk.blue.bold(server_IP));
    console.log('----------------------------------------------------------');
    // console.log(shadowContent);
  } catch (err) {
    console.log(err);
  }
  resolve()
})

const runYCSB = (opt, runtype) => new Promise(resolve => {
  if (opt.iotracer == true) { // IOracer 옵션이 있을 경우Otracer 를 실행함
    if (opt.runtype == 'load' || opt.runtype == 'run' || ((opt.runtype == 'loadrun') && (runtype == 'load')))
      nodeIPArr.forEach((ip) => {
        try {
          io_run_cmd = `ssh root@${ip} ${IO_tracer_dir}/bin/iotracer -m ${IO_driverManager_dir} ${IO_watch_dir} -i ${timewindow_iotracer} -o ${IO_output_dir}/${opt.name} -p 1048576`
           console.log('IORUNCMD', io_run_cmd)

          run_cmd_exec = spawn(io_run_cmd, null, {
            shell: true
          });

          console.log('----------------------------------------------------------');
          console.log(chalk.green.bold('[INFO]'), 'run iotracer : ', chalk.blue.bold(ip));
          // console.log('----------------------------------------------------------');

        } catch (err) {
          console.log(err);
        }
      })
  }
  try { // error가 없는 경우 벤치마킹을 수행함
    if (opt.dbtype == 'cassandra' && opt.remove == true) {
      if (opt.runtype == 'load') {
        dropData().then(createData())
      } else if ((opt.runtype == 'loadrun') && (runtype == 'load')) {
        dropData().then(createData())
      }
    } else if (opt.dbtype == 'cassandra' && opt.remove == null && runtype == 'load') {
      createData()
    }
    if (opt.dbtype == 'arangodb') {
      dropDBBeforeRun = 'true'
      if (opt.runtype == 'run' || runtype == 'run') {
        dropDBBeforeRun = 'false'
      }
    }

    let cmd = ''
    if (opt.dbtype == 'cassandra') {
      cmd = `cd YCSB && \
              ./bin/ycsb ${runtype} cassandra-cql -P workloads/${opt.wlfile} -p hosts=${nodes_IP} -p measurementtype=timeseries ${loadsizeCmd} \
              -p timeseries.granularity=${timewindow_ycsb} -p exporter=${ycsb_exporter} -p exportfile=${ycsb_exportfile_dir}/${opt.name}/${runtype}_result \
              -threads ${opt.threads} -p cassandra.tracing=${cassandraTracing} -s`
    } else if (opt.dbtype == 'arangodb') {
      cmd = `cd YCSB && \
              ./bin/ycsb ${runtype} ${opt.dbtype} -P workloads/${opt.wlfile} -p arangodb.ip=${nodetool_ip} -p arangodb.port=${8529} -p measurementtype=timeseries ${loadsizeCmd} \
              -p timeseries.granularity=${timewindow_ycsb} -p arangodb.dropDBBeforeRun=${dropDBBeforeRun} -p exporter=${ycsb_exporter} -p exportfile=${ycsb_exportfile_dir}/${opt.name}/${runtype}_result \
              -threads ${opt.threads} -s`
    }

    // console.log(cmd);
    let cmd_exec;
    if (!opt.flag) {
      cmd = 'pwd'
      // console.log('CMD', cmd)
    }
    // console.log(cmd);
    try {
      cmd_exec = spawn(cmd, null, {shell: true});
      // console.log('CMD', cmd)


      console.log('----------------------------------------------------------');
      console.log(chalk.green.bold('[INFO]'), `YCSB ${runtype} started.`);
      console.log('----------------------------------------------------------');
    } catch (err) {
      console.log(chalk.red.bold('[ERROR]'), err);
    }

    let file = `./YCSB/workloads/${opt.wlfile}`
    try {
      fs.statSync(file);

      const properties = PropertiesReader(`./YCSB/workloads/${opt.wlfile}`)
      recordcount = properties.get('recordcount')
      operationcount = properties.get('operationcount')
    } catch (err) {
      console.log(err);
    }

    let flag = true
    let flag2 = true
    cmd_exec.stderr.on('data', function(data) {
      data = data.toString()
      console.log(data)
      if (data.includes('Exception')) {
        flag = false
      }
      let count = data.split(" ")
      if (opt.event) {
        switch (runtype) {
          case 'load':
            if (recordcount * (opt.event) * 0.01 < count[4] && count[4] < recordcount * (parseInt(opt.event) + parseInt("3")) * 0.01) {
              // 이벤트 내용 추가
              if (flag2 == true) {
                exec(`ssh root@203.255.92.195 ${node_homedir}/killShell/killCass.sh`);
                console.log(chalk.green.bold('[INFO]'), 'kill 195 cassandra');
                setTimeout(function() {
                  exec(`ssh root@203.255.92.195 ${node_cassandra_dir}/bin/cassandra -R`);
                  console.log(chalk.green.bold('[INFO]'), 'run 195 cassandra');
                }, 1 * 1000);
                console.log('--------------------------------------');
                console.log(chalk.green.bold('[INFO]'), `${opt.event} % complete`);
                console.log('recordcount : ', count[4]);
                console.log(`recordcount*${opt.event*0.01} : `, recordcount * opt.event * 0.01);
                console.log('--------------------------------------');
                flag2 = false
              }
            }
            break;
            //case 'run':
            // if (operationcount * (opt.event) * 0.01 < count[4] && count[4] < operationcount * (parseInt(opt.event) + parseInt("5")) * 0.01) {
            // 이벤트 내용 추가
            // console.log('--------------------------------------');
            //console.log(chalk.green.bold('[INFO]'), `${opt.event} % complete`);
            // console.log('operationcount : ', count[4]);
            // console.log(`operationcount*${opt.event*0.01} : `, operationcount * opt.event * 0.01);
            // console.log('--------------------------------------');
            // }
            // break;
        }
      }
    })

    cmd_exec.stdout.on('data', (data) => {
      data = data.toString()
      if(!data.includes('sec')){
        console.log(data);
      }
    });

    cmd_exec.on('close', function(code) {
      console.log('----------------------------------------------------------');
      console.log(chalk.green.bold('[INFO]'), `YCSB ${runtype} completed.`);
      console.log('----------------------------------------------------------');

      let file = `${ycsb_exportfile_dir}/${opt.name}/${runtype}_result`
      try {
        // setTimeout(function() {
          fs.statSync(file);
          exec(`${server_homedir}/json2csv.sh ${file}`);
          console.log('----------------------------------------------------------');
          console.log(chalk.green.bold('[INFO]'), `converted YCSB RESULT from JSON to csv.`);
          console.log('----------------------------------------------------------');
        // }, 5000);
      } catch (err) {
        console.log('----------------------------------------------------------');
        console.log(chalk.red.bold('[ERROR]'), `Failed to convert YCSB RESULT from JSON to csv.`);
        console.log('----------------------------------------------------------');
        console.log(err);
      }

      if (opt.dbtype == 'cassandra') {
        if (((opt.runtype == 'load') || (opt.runtype == 'run')) || ((opt.runtype == 'loadrun') && (runtype == 'run'))) {
          nodeIPArr.forEach((ip) => {
            let kill_cmd = `ssh root@${ip} ${node_homedir}/killShell/killCass.sh`
            // console.log('KILL_CMD', kill_cmd)
            try {
              let kill_exec = exec(kill_cmd);
              console.log('----------------------------------------------------------');
              console.log(chalk.green.bold('[INFO]'), 'kill cassandra : ', chalk.blue.bold(ip));
              // console.log('----------------------------------------------------------');
            } catch (err) {
              console.log('----------------------------------------------------------');
              console.log(chalk.red.bold('[ERROR]'), `Failed to kill cassandra.`);
              console.log('----------------------------------------------------------');
              console.log(err);
            }
          })


          if (opt.iotracer == true) { // 벤치마킹 종료 후 iotracer 결과를 저장함
            if ((opt.runtype == 'load') || (opt.runtype == 'run') || ((opt.runtype == 'loadrun') && (runtype == 'run'))) {
              get_IO_results(opt.name, nodeIPArr, opt.runtype)

              setTimeout(function() {
                nodeIPArr.forEach((ip) => {
                  let result_cmd = `ssh root@${ip} ${IO_tracer_dir}/result.sh ${IO_output_dir}/${opt.name} ${server_IP} ${ycsb_exportfile_dir}/${opt.name}/${ip}_${opt.runtype}_output`
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
          }

          console.log('----------------------------------------------------------');
          console.log(chalk.green.bold('[INFO]'), 'Benchmark Completed : ', chalk.blue.bold(opt.name));
          console.log('----------------------------------------------------------');

          let iotracer_status = check_iotracer(status, opt.iotracer)
          // console.log('IOTRACER_STATUS', iotracer_status)
          let dbtype_status = check_dbtype(status, opt.dbtype, opt.casstracing)
          // console.log('DBTYPE_STATUS', dbtype_status)
          let runtype_status = check_runtype(status, opt.runtype)
          // console.log('RUNTYPE_STATUS', runtype_status)
          let wlfile_status = check_Fileexist(status, opt.wlfile)
          // console.log('WLFILE_STATUS', wlfile_status)
          let loadsize_status = check_loadsize(status, opt.runtype, opt.loadsize)
          // console.log('LOADSIZE_STATUS', loadsize_status)
          let timewindow_status = check_Timewindow(status, opt)
          // console.log('TIMEWINDOW_STATUS', timewindow_status)
          let threads_status = check_threads(status, opt)
          // console.log('THREADS_STATUS', threads_status)

        }
      } else if (opt.dbtype == 'arangodb') {
        if (((opt.runtype == 'load') || (opt.runtype == 'run')) || ((opt.runtype == 'loadrun') && (runtype == 'run'))) {
          nodeIPArr.forEach((ip) => {
            let kill_cmd = `ssh root@${ip} ${node_homedir}/killShell/killArango.sh`
            // console.log('KILL_CMD', kill_cmd)
            try {
              let kill_exec = exec(kill_cmd)
              console.log('----------------------------------------------------------');
              console.log(chalk.green.bold('[INFO]'), 'kill arangodb : ', chalk.blue.bold(ip));
              // console.log('----------------------------------------------------------');
            } catch (err) {
              console.log('----------------------------------------------------------');
              console.log(chalk.red.bold('[ERROR]'), `Failed to kill arangodb.`);
              console.log('----------------------------------------------------------');
              console.log(err);
            }
          })


          if (opt.iotracer == true) { // 벤치마킹 종료 후 iotracer 결과를 저장함
            if ((opt.runtype == 'load') || (opt.runtype == 'run') || ((opt.runtype == 'loadrun') && (runtype == 'run'))) {
              get_IO_results(opt.name, nodeIPArr, opt.runtype)

              setTimeout(function() {
                nodeIPArr.forEach((ip) => {
                  let result_cmd = `ssh root@${ip} ${IO_tracer_dir}/result.sh ${IO_output_dir}/${opt.name} ${server_IP} ${ycsb_exportfile_dir}/${opt.name}/${ip}_${opt.runtype}_output`
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
          }

          console.log('----------------------------------------------------------');
          console.log(chalk.green.bold('[INFO]'), 'Benchmark Completed : ', chalk.blue.bold(opt.name));
          console.log('----------------------------------------------------------');
          let iotracer_status = check_iotracer(status, opt.iotracer)
          // console.log('IOTRACER_STATUS', iotracer_status)
          let dbtype_status = check_dbtype(status, opt.dbtype, opt.casstracing)
          // console.log('DBTYPE_STATUS', dbtype_status)
          let runtype_status = check_runtype(status, opt.runtype)
          // console.log('RUNTYPE_STATUS', runtype_status)
          let wlfile_status = check_Fileexist(status, opt.wlfile)
          // console.log('WLFILE_STATUS', wlfile_status)
          let loadsize_status = check_loadsize(status, opt.runtype, opt.loadsize)
          // console.log('LOADSIZE_STATUS', loadsize_status)
          let timewindow_status = check_Timewindow(status, opt)
          // console.log('TIMEWINDOW_STATUS', timewindow_status)
          let threads_status = check_threads(status, opt)
          // console.log('THREADS_STATUS', threads_status)
        }
      }
      resolve(flag)
    })

  } catch (err) {
    console.log(err);
  }

})

function check_dbtype(status, dbtype, casstracing) {
  return new Promise(function(resolve, reject) {
    // console.log('----------------------------------------------------------');
    console.log(chalk.green.bold('[INFO]'), 'dbtype :', chalk.blue.bold(dbtype));
    // console.log('----------------------------------------------------------');

    if (dbtype == 'cassandra') { // 카산드라일때 tracing 옵션
      dbtype = 'cassandra-cql'
      if (casstracing == true) {
        cassandraTracing = 'true'
        // console.log('----------------------------------------------------------');
        console.log(chalk.green.bold('[INFO]'), 'cassandraTracing :', chalk.blue.bold(cassandraTracing));
        // console.log('----------------------------------------------------------');
      } else {
        cassandraTracing = 'false'
        // console.log('----------------------------------------------------------');
        console.log(chalk.green.bold('[INFO]'), 'cassandraTracing :', chalk.blue.bold(cassandraTracing));
        // console.log('----------------------------------------------------------');
      }
      return resolve(status * -1)
    } else {
      return resolve(status * -1)
    }
  });
}

function check_iotracer(status, iotracer) {
  return new Promise(function(resolve, reject) {
    if (iotracer == true) {
      iotracing = 'true'
      // console.log('----------------------------------------------------------');
      console.log(chalk.green.bold('[INFO]'), 'iotracer :', chalk.blue.bold(iotracing));
      // console.log('----------------------------------------------------------');
    } else {
      iotracing = 'false'
      // console.log('----------------------------------------------------------');
      console.log(chalk.green.bold('[INFO]'), 'iotracer :', chalk.blue.bold(iotracing));
      // console.log('----------------------------------------------------------');
    }
    return resolve(status * -1)
  });
}

function get_IO_results(bmname, nodeIPArr, runtype) {
  nodeIPArr.forEach((ip) => { // iotracer 종료 후
    let kill_io_cmd = `ssh root@${ip} sh ${node_homedir}/killShell/killIO.sh`
    // console.log('KILL_IO_CMD', kill_io_cmd)
    try {
      let kill_io_exec = exec(kill_io_cmd)
      console.log('----------------------------------------------------------');
      console.log(chalk.green.bold('[INFO]'), 'kill iotracer : ', chalk.blue.bold(ip));
      // console.log('----------------------------------------------------------');
    } catch (err) {
      console.log('----------------------------------------------------------');
      console.log(chalk.red.bold('[ERROR]'), `Failed to kill iotracer.`);
      console.log('----------------------------------------------------------');
      console.log(err);
    }
  })
}

function check_runtype(status, runtype) {
  return new Promise(function(resolve, reject) {
    if (runtype == 'load' || runtype == 'run' || runtype == 'loadrun') {
      // console.log('----------------------------------------------------------');
      console.log(chalk.green.bold('[INFO]'), 'runtype :', chalk.blue.bold(runtype));
      // console.log('----------------------------------------------------------');
      return resolve(status * -1)
    } else {
      // console.log('----------------------------------------------------------');
      console.log(chalk.red.bold('[ERROR]'), 'runtype :', 'invalid runtype', chalk.blue.bold(runtype), `, (choose from 'load', 'run', 'loadrun')`)
      // console.log('----------------------------------------------------------');
      return resolve(status * 1)
    }
  });
}

function check_Fileexist(status, wlfile) {
  return new Promise(function(resolve, reject) {
    if (wlfile == null) {
      // console.log('----------------------------------------------------------');
      console.log(chalk.red.bold('[ERROR]'), 'workload file :', 'enter workload file name or type (news, contents, facebook, log, recommendation ..)')
      // console.log('----------------------------------------------------------');
    } else {
      let file = `./YCSB/workloads/${wlfile}`
      try {
        fs.statSync(file);
        // console.log('----------------------------------------------------------');
        console.log(chalk.green.bold('[INFO]'), 'workload file :', chalk.blue.bold(wlfile));
        // console.log('----------------------------------------------------------');
        return resolve(status * -1) //success : 1
      } catch (err) {

        // console.log('----------------------------------------------------------');
        console.log(chalk.red.bold('[ERROR]'), 'workload name :', 'invalid workload file', chalk.blue.bold(wlfile), '(No such type of file)')
        // console.log('----------------------------------------------------------');
        console.log(err);
        return resolve(status * 1) //fail : -1
      }
    }
  });
}


function check_loadsize(status, runtype, loadsize) {
  return new Promise(function(resolve, reject) {
    if ((runtype == 'run') && (loadsize)) { // run인데 load size가 있는 경우
      // console.log('----------------------------------------------------------');
      console.log(chalk.red.bold('[ERROR]'), 'load size :', `'load size' is ,load', 'loadrun' option.`)
      // console.log('----------------------------------------------------------');
      return resolve(status) //fail : -1
    } else if ((runtype == 'load' || runtype == 'loadrun') && (loadsize)) { // load에 대한 loadsize 옵션
      // 10M -> 10
      let loadsizeInfo = chalk.magenta('load size')
      let fieldcount = 10
      let fieldlength = Math.pow(10, 6) / fieldcount

      if (loadsize.match(/M/)) {
        recordcount = loadsize.split('M')[0]
        loadsizeCmd = `-p fieldcount=${fieldcount} -p fieldlength=${fieldlength} -p recordcount=${recordcount}`
        // console.log('----------------------------------------------------------');
        console.log(chalk.green.bold('[INFO]'), 'load size :', chalk.blue.bold(loadsize));
        // console.log('----------------------------------------------------------');
        return resolve(status * -1) //success : 1
      } else if (loadsize.match(/G/)) {
        recordcount = loadsize.split('G')[0] * Math.pow(10, 3)
        loadsizeCmd = `-p fieldcount=${fieldcount} -p fieldlength=${fieldlength} -p recordcount=${recordcount}`
        // console.log('----------------------------------------------------------');
        console.log(chalk.green.bold('[INFO]'), 'load size :', chalk.blue.bold(loadsize));
        // console.log('----------------------------------------------------------');
        return resolve(status * -1) //success : 1
      } else if (loadsize.match(/T/)) {
        recordcount = loadsize.split('T')[0] * Math.pow(10, 6)
        loadsizeCmd = `-p fieldcount=${fieldcount} -p fieldlength=${fieldlength} -p recordcount=${recordcount}`
        // console.log('----------------------------------------------------------');
        console.log(chalk.green.bold('[INFO]'), 'load size :', chalk.blue.bold(loadsize));
        // console.log('----------------------------------------------------------');
        return resolve(status * -1) //success : 1
      } else { // 형식이 안 맞으면 error
        loadsizeLine = `${error} ${loadsizeInfo} : enter load size in (###M, ###G, ###T) format.`
        loadsizeCmd = ''
        // console.log('----------------------------------------------------------');
        console.log(chalk.red.bold('[ERROR]'), 'load size :', 'enter load size in (###M, ###G, ###T) format.');
        // console.log('----------------------------------------------------------');
        return resolve(status) //success : 1
      }
    } else {
      loadsizeCmd = ''
      return resolve(status * -1) //success : 1
    }
  });
}

function benchmark_name(opt) {
  if ((typeof opt.name) == 'function') { // n 값이 없으면 디폴트값 만들어줌
    opt.name = 'ycsb_result_1'
    try {
      while (1) {
        let file = `${ycsb_exportfile_dir}/${opt.name}`
        fs.statSync(file); // 파일 존재 확인

        let string = opt.name
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
        opt.name = `ycsb_result_${seqNum}`
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        // console.log(chalk.red.bold('[ERROR]'),'There was an error.')
        // console.log(err);
      }
    }
  } else { //n 값이 있으면 else if((typeof opt.name) == 'string')
    const path = `${ycsb_exportfile_dir}`
    var file = opt.name
    // console.log(file);
    //console.log(file.split("_")[1])
    //split 하면 배열로 반환됨
    const fs = require('fs')

    while (1) {
      // console.log(file)
      var array = file.split("_") //som, som, 1
      try {
        if (!fs.existsSync(path + '/' + file)) {
          fs.mkdirSync(path + '/' + file)
        } else if (fs.existsSync(path + '/' + file) && array.length >= 2) {
          let num = Number(array[array.length - 1]); //
          // console.log('exists')
          if (isNaN(num)) {
            file = file + '_' + 1
            fs.mkdirSync(path + '/' + file)

            opt.name = file
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
            opt.name = file
          } else {
            file = file + '_' + 1 //som_som_1
            fs.mkdirSync(path + '/' + file)
            //opt.name = file
            opt.name = file
          }
          break;
        } else if (array.length == 1) {
          file = array[0] + '_' + 1
          fs.mkdirSync(path + '/' + file)

          opt.name = file
        }
        break;
      } catch (err) {
        continue;
      }
    }
  }
  console.log('----------------------------------------------------------');
  console.log(chalk.green.bold('[INFO]'), 'benchmark Name :', chalk.blue.bold(opt.name));
  console.log('----------------------------------------------------------');

  try {
    exec(`mkdir ${ycsb_exportfile_dir}/${opt.name}`)
  } catch (err) {
    console.log(err);
  }
}

function isNumber(s) { // 입력이 숫자인지 확인해주는 함수
  s += ''; // 문자열로 변환
  s = s.replace(/^\s*|\s*$/g, ''); // 좌우 공백 제거
  if (s == '' || isNaN(s)) return false;
  return true;
}

function check_Timewindow(status, opt) {
  return new Promise(function(resolve, reject) {
    if (opt.timewindow == null) {
      opt.timewindow = 1
      // console.log('----------------------------------------------------------');
      console.log(chalk.green.bold('[INFO]'), 'timewindow :', chalk.blue.bold(`${opt.timewindow} (sec)`));
      // console.log('----------------------------------------------------------');
      timewindow_ycsb = `${opt.timewindow}` * Math.pow(10, 3)
      timewindow_iotracer = `${opt.timewindow}`
      return resolve(status * -1) //success : 1
    } else {
      if (isNumber(opt.timewindow)) {
        // console.log('----------------------------------------------------------');
        console.log(chalk.green.bold('[INFO]'), 'timewindow :', chalk.blue.bold(`${opt.timewindow} (sec)`));
        // console.log('----------------------------------------------------------');
        timewindow_ycsb = `${opt.timewindow}` * Math.pow(10, 3)
        timewindow_iotracer = `${opt.timewindow}`
        return resolve(status * -1) //success : 1
      } else {
        // console.log('----------------------------------------------------------');
        console.log(chalk.red.bold('[ERROR]'), 'timewindow :', ` enter timewindow as number type.`)
        // console.log('----------------------------------------------------------');
        return resolve(status) //success : 1
      }
    }
  });
}

function check_threads(status, opt) {
  // let timewindow = ''
  return new Promise(function(resolve, reject) {
    if (opt.threads == null) {
      opt.threads = 1
      // console.log('----------------------------------------------------------');
      console.log(chalk.green.bold('[INFO]'), 'threads :', chalk.blue.bold(`${opt.threads}`));
      console.log('----------------------------------------------------------');
      return resolve(status * -1) //success : 1
    } else {
      if (isNumber(opt.threads)) {
        // console.log('----------------------------------------------------------');
        console.log(chalk.green.bold('[INFO]'), 'threads :', chalk.blue.bold(`${opt.threads}`));
        console.log('----------------------------------------------------------');
        return resolve(status * -1) //success : 1
      } else {
        // console.log('----------------------------------------------------------');
        console.log(chalk.red.bold('[ERROR]'), 'threads :', ` enter threads as number type.`)
        console.log('----------------------------------------------------------');
        return resolve(status) //success : 1
      }
    }
  });
}
