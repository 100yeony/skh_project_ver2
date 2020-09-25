var inquirer = require('inquirer');
var fs = require('fs');
const program = require('commander');
const property = require('../../propertiesReader.js')
const installDir = property.get_server_install_dir_WL()
const fileDir1 = property.get_server_file1_dir()
const fileDir2 = property.get_server_file2_dir()

var dir1 = installDir+fileDir1;
var dir2 = installDir+fileDir2;

program.command('generate-wl')




program.parse(process.argv)

  const q1 = [
    {
      type : 'list',
      name : 'dft',
      message : 'Please select a file type to delete.',
      choices : ['YCSB','Graph']
    }
  ];
  const questions1 = [
    {
    type : 'list',
    name : 'dfn',
    message : 'Please select a file name to delete.',
    choices : []
    }
  ];
  const questions2 = [
    {
    type : 'list',
    name : 'dfn',
    message : 'Please select a file name to delete.',
    choices : []
    }
  ];
  const filelist1 = fs.readdirSync(dir1);
  const filelist2 = fs.readdirSync(dir2);
  questions1[0].choices = filelist1;
  questions2[0].choices = filelist2;

  async function main(){
  const answers = await inquirer.prompt(q1);
    if(answers.dft === 'YCSB'){
      inquirer.prompt(questions1).then(answer =>{
        if(answer){
          fs.unlinkSync(dir1+answer.dfn);
            console.log('File has been deleted.');
        }
      });
    } else {
      inquirer.prompt(questions2).then(answer =>{
        if(answer){
          fs.unlinkSync(dir2+answer.dfn);
            console.log('File has been deleted.');
        }
      });
    }
}

module.exports.main = main;
