#!/usr/bin/env node

const program = require('commander')
const ycsbAction = require('../lib/ycsb.js')
const nosqlTests = require('../lib/nosqlTests.js')
const chalk = require('chalk')
const error = chalk.red('ERR!')
const exec =  require('child_process').exec

program
  .command('cassandra')
  // .option('-d, --dbtype <dbtype>', `insert dbtype, choose from 'cassandra', 'arangodb', 'orientdb'`)
  .option('-r, --runtype <runtype>', `insert runtype, choose from 'load', 'run', 'loadrun'`)
  .option('-l, --loadsize <loadsize>', `insert load size [###M, ###G, ###T]`)
  .option('-w, --wlfile <wlfile>', `insert workload file type or name [type:news, contents, facebook, log, recommendation ..]`)
  // .option('-c --config <config>', `config 파일 입력`)
  .option('-n, --name <name>', `insert benchmark name`)
  // .option('-o, --output <output>', `assign output directory (server, node)`)
  .option('-s, --timewindow <timewindow>', `insert time window (sec) (default : 1 sec)`)
  .option('-t, --threads <threads>',`insert number of threads (default : 1)`)
  .option('-m, --remove', `remove cassandra data before running benchmark (default : off)`)
  .option('-c, --casstracing',`enable the cassandra tracing option (default : off)`)
  .option('-i, --iotracer',`run iotracing option (default : off)`)
  .option('-e, --event <event>', `Add events by specifying a percentage.`)
  .action(function(opt){
    exec('chmod -R +x .')
    opt.dbtype = 'cassandra'
    ycsbAction.ycsb(opt);
})

program
  .command('arangodb')
  // .option('-d, --dbtype <dbtype>', `insert dbtype, choose from 'cassandra', 'arangodb', 'orientdb'`)
  .option('-r, --runtype <runtype>', `insert runtype, choose from 'load', 'run', 'loadrun'`)
  .option('-l, --loadsize <loadsize>', `insert load size [###M, ###G, ###T]`)
  .option('-w, --wlfile <wlfile>', `insert workload file type or name [type:news, contents, facebook, log, recommendation ..]`)
  // .option('-c --config <config>', `config 파일 입력`)
  .option('-n, --name <name>', `insert benchmark name`)
  // .option('-o, --output <output>', `assign output directory (server, node)`)
  .option('-s, --timewindow <timewindow>', `insert time window (sec) (default : 1 sec)`)
  .option('-t, --threads <threads>',`insert number of threads (default : 1)`)
  // .option('-m, --remove', `remove arangodb data before running benchmark (default : off)`)
  // .option('-c, --casstracing',`enable the cassandra tracing option (default : off)`)
  .option('-i, --iotracer',`run iotracing option (default : off)`)
  .option('-e, --event <event>', `Add events by specifying a percentage. (default : 0)`)
  .action(function(opt){
    exec('chmod -R +x .')
    opt.dbtype = 'arangodb'
    ycsbAction.ycsb(opt);
})

program
  .command('orientdb')
  .option('-r, --runtype <runtype>', `insert runtype, choose from 'load', 'run', 'loadrun'`)
  .option('-b, --bmname <name>', `insert benchmark name`)
  .option('-n, --name <name>', `insert workload file name`)
  .option('-t, --time <time>', `insert set time (default : 10000(ms))`)
  .option('-s, --size <size>', `insert load size, choose from 'LDBC#'(#:number of 1~7), 'pokec', 'livejournal'`)
  .option('-i, --iotracer',`run iotracing option (default : off)`)
  .action(function(opt){
    exec('chmod -R +x .')

    if((typeof(opt.runtype)== 'string') && (typeof(opt.name)== 'string') && (typeof(opt.size)) =='string'){ // 필수 옵션이 있으면 실행 ,,
      nosqlTests.graphbench(opt);
    }else{
      console.log('----------------------------------------------------------');
      console.log(chalk.red.bold('[ERROR]'), 'insert necessary option :', chalk.blue.bold('-r'),',', chalk.blue.bold('-n'),',', chalk.blue.bold('-s'));
      console.log('----------------------------------------------------------');
      let helpcmd = `Benchmarking/bin/benchmark.js orientdb -help`
      // console.log(helpcmd);
      const helpexec = exec(helpcmd)
      helpexec.stdout.on('data', function(data){
        console.log(data);
      })
    }

})

program.parse(process.argv);
