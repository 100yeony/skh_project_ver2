const execFile = require('child_process').execFile;
const exec = require('child_process').execSync;
const cmds = require('../lib/cmds.js')
const chalk = require('chalk');

module.exports.cassandraSetClusterEnv = (conf, nodes) => {
  var fs = require('fs');
  var data =  fs.readFileSync(`${conf}`, 'utf-8')
  var update_seeds = data.replace('127.0.0.1', `${nodes}`);
  var update_loba = update_seeds.replace('# listen_on_broadcast_address: false', 'listen_on_broadcast_address: true');
  var update_rpc = update_loba.replace('start_rpc: false', 'start_rpc: true');
  fs.writeFileSync(`${conf}`, update_rpc, 'utf-8');
}


module.exports.cassandraCopy = (nodes, node_arr, cassandraHome, node_dir, conf, update_conf) => {
  for(var i in node_arr){
     var node = node_arr[i];
     var fs = require('fs');
     var data =  fs.readFileSync(`${conf}`, 'utf-8');
     //listen_address와 rpc_address를 각 노드의 IP로 설정
     var set_node = data.replace(/localhost/g, `${node}`);
     fs.writeFileSync(`${conf}`, set_node, 'utf-8');
     exec(`scp -r ${cassandraHome} root@${node}:${node_dir}`)
     console.log(chalk.green.bold('[INFO]'), 'transmitting...', node_arr[i]);
     //listen_address와 rpc_address를 다시 초기 상태로 설정
     var fs = require('fs');
     var data =  fs.readFileSync(`${conf}`, 'utf-8')
     var undo_node_info = data.replace(new RegExp(node,'g'), 'localhost');
     var undo_seeds = undo_node_info.replace('localhost', `${node}`);
     fs.writeFileSync(`${conf}`, undo_seeds, 'utf-8');
  }

  var data = fs.readFileSync(`${conf}`, 'utf-8')
  //seeds를 초기 상태로 설정
  var undo_seeds = data.replace(new RegExp(nodes,'g'), '127.0.0.1');
  fs.writeFileSync(`${conf}`, undo_seeds, 'utf-8');
  exec(`${cmds.copy} ${conf} ${update_conf}`)
}
