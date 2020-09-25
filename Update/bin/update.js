#!/usr/bin/env node
const chalk = require('chalk')
const program = require('commander')
const property = require('../../propertiesReader.js')
const cassandraAction = require('../lib/update_cassandra_conf.js')

program
  .command('update')
  .option('-d, --dbtype <dbtype>', `dbtype을 입력 (cassandra, arangodb, orientdb)`)
  .action(function(opt){
    var nodes = property.get_nodes_IP();
    var node_arr = nodes.split(',');
    ip = property.get_nodes_IP().split(',');
    updateDBconf(opt, nodes, node_arr)
})

program.parse(process.argv)

function updateDBconf(opt, nodes, node_arr){
  switch(opt.dbtype){
    case 'cassandra' :
      var node_dir = property.get_node_cassandra_dir()
      var node_cassandraHome = `${node_dir}`
      var node_conf_path = `${node_cassandraHome}/conf/cassandra.yaml`
      var update_conf_path = property.get_update_conf_path()
      var update_conf = `${update_conf_path}cassandra.yaml`
      //update를 위한 cassandra.yaml파일 존재 유무 확인
      var fs = require('fs');
      var exists = fs.existsSync(`${update_conf}`);
      if(exists==true){
       cassandraAction.updateCassandraConf(nodes, node_arr, update_conf, node_conf_path)
       console.log(chalk.green.bold('[INFO]'), 'update cassandra configurations');
      }else{
       console.log(chalk.red.bold('[Error]'), 'conf file not found');
       break;
      }
      break;
    default :
      console.log(chalk.red.bold('[Error]'), '(cassandra, arangodb, orientdb)를 입력해주세요.');
      break;
    }
}
