#!/usr/bin/env node
var inquirer = require('inquirer');
const program = require('commander');

var question = [
  {
    type : 'list',
    name : 'start',
    message : 'Please select the program you want to run.',
    choices : ['create','update','delete','read']
  }
];

inquirer.prompt(question).then(answers =>{
  //파일 생성
  if(answers.start === 'create'){
    require('./WLgenerate_create.js');
  }
  //파일 수정
  else if (answers.start === 'update'){
    const updateFiles = require('./WLgenerate_update.js');
    updateFiles.main2();
  //파일 읽기
}else if(answers.start ==='read'){
    const readFiles = require('./WLgenerate_read');
    readFiles.main3();
  }
  //파일 삭제
  else {
    var deleteFiles = require('./WLgenerate_delete.js');
    deleteFiles.main();
      }
  }
);
