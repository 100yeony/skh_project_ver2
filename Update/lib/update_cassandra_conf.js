const chalk = require('chalk');
const execFile = require('child_process').execFile;
const exec = require('child_process').execSync;

module.exports.updateCassandraConf = (seeds, nodes, update_conf, node_conf_path) => {

  var fs = require('fs');
  var data =  fs.readFileSync(`${update_conf}`, 'utf-8')
  var update_seeds = data.replace('127.0.0.1', `${seeds}`);
  fs.writeFileSync(`${update_conf}`, update_seeds, 'utf-8');

  for(var i in nodes){
     var node = nodes[i];
     var fs = require('fs');
     var data =  fs.readFileSync(`${update_conf}`, 'utf-8');
     var set_node = data.replace(/localhost/g, `${node}`);
     fs.writeFileSync(`${update_conf}`, set_node, 'utf-8');
     exec(`scp -r ${update_conf} root@${node}:${node_conf_path}`)
     console.log(chalk.green.bold('[INFO]'), 'transmitting...', nodes[i]);
     var fs = require('fs');
     var data =  fs.readFileSync(`${update_conf}`, 'utf-8')
     var undo_node_info = data.replace(new RegExp(node,'g'), 'localhost');
     var undo_seeds = undo_node_info.replace('localhost', `${node}`);
     fs.writeFileSync(`${update_conf}`, undo_seeds, 'utf-8');
  }

  var data = fs.readFileSync(`${update_conf}`, 'utf-8')
  var undo_seeds = data.replace(new RegExp(seeds,'g'), '127.0.0.1');
  fs.writeFileSync(`${update_conf}`, undo_seeds, 'utf-8');
}
