var inquirer = require('inquirer');
var fs = require('fs');
const program = require('commander');
const property = require('../../propertiesReader.js')
var updateFiles = require('./WLgenerate_update.js');
const installDir = property.get_server_install_dir_WL()
const fileDir1 = property.get_server_file1_dir()
const fileDir2 = property.get_server_file2_dir()

var dir1 = installDir+fileDir1;
var dir2 = installDir+fileDir2;
program
  .command('generate-wl')


program.parse(process.argv)

  const q1 = [
    {
      type : 'list',
      name : 'dft',
      message : 'Please select the file type you want to check',
      choices : ['YCSB','Graph']
    }
  ];
  const questions1 = [
    {
    type : 'list',
    name : 'dfn',
    message : 'Please select the file you want to check.',
    choices : []
    }
  ];
  const questions2 = [
    {
    type : 'list',
    name : 'dfn',
    message : 'Please select the file you want to check.',
    choices : []
    }
  ];
  const filelist1 = fs.readdirSync(dir1);
  const filelist2 = fs.readdirSync(dir2);

  questions1[0].choices = filelist1;
  questions2[0].choices = filelist2;

  async function main3(){
  const answers = await inquirer.prompt(q1);
  if(answers.dft === 'YCSB'){
    inquirer.prompt(questions1).then(answer =>{
      if(answer){
        fs.readFile(dir1+answer.dfn,'utf-8',(err,data)=>{
          if(err){
            console.log(err);
          }
          console.log(data);
          inquirer.prompt([{
            type : 'confirm',
            name : 'updateQ',
            message : 'Do you want to modify it?',
            default : false
            }
          ]).then(answerss =>{
            if(answerss.updateQ === true){
              updateFiles.main2();
            }
          });
        });
      };
    });
  } else {
    inquirer.prompt(questions2).then(answer =>{
      if(answer){
        fs.readFile(dir2+answer.dfn,'utf-8',(err,data)=>{
          if(err){
            console.log(err);
          }
          console.log(data);
          inquirer.prompt([{
            type : 'confirm',
            name : 'updateQ',
            message : 'Do you want to modify it?',
            default : false
            }
          ]).then(answerss =>{
            if(answerss.updateQ === true){
              updateFiles.main2();
            }
          });
        });
      };
    });
  }

}

module.exports.main3 = main3;
