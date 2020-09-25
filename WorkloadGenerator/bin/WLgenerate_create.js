var inquirer = require('inquirer');
var fs = require('fs');
const program = require('commander');
const property = require('../../propertiesReader.js')
const installDir = property.get_server_install_dir_WL()
const fileDir1 = property.get_server_file1_dir()
const fileDir2 = property.get_server_file2_dir()

var dir1 = installDir+fileDir1;
var dir2 = installDir+fileDir2;

program
  .command('generate-wl')




program.parse(process.argv)

//파일 type&이름
var question = [
  {
    type : 'list',
    name : 'type',
    message : 'Please select type.',
    choices : ['YCSB','GRAPH'],
  },{
    type : 'input',
    name : 'name',
    message : 'Please enter a name for the file.',
    default : 'workloads',
  }];

//YCSB 속성
var q1 = [
  {
    type : 'input',
    name : 'Record_count',
    message : 'YCSB properties-Record count',
    validate: function(value) {
      var valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter : Number,
    default : 1000,
    }
  ,{
    type : 'input',
    name : 'Field_count',
    message : 'YCSB properties-Field count',
    validate: function(value) {
      var valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
    default : 10
  },{
    type : 'input',
    name : 'fieldlength',
    message : 'YCSB properties-Field length',
    validate: function(value) {
      var valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
    default : 100
  },{
    type : 'input',
    name : 'minfieldlength',
    message : 'YCSB properties-minfieldlength',
    validate: function(value) {
      var valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
    default : 1
  },{
    type : 'list',
    name : 'readallfields',
    message : 'YCSB properties-readallfields',
    choices : ['true','false'],
    default : true
  },{
    type : 'list',
    name : 'writeallfields',
    message : 'YCSB properties-writeallfields',
    choices : ['true','false'],
    default : false
  },{
    type : 'input',
    name : 'readproportion',
    message : 'YCSB properties-readproportion',
    validate: function(value) {
      var valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
    default : 0.95
  },{
    type : 'input',
    name : 'updateproportion',
    message : 'YCSB properties-updateproportion',
    validate: function(value) {
      var valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
    default : 0.05
  },{
    type : 'input',
    name : 'insertproportion',
    message : 'YCSB properties-insertproportion',
    validate: function(value) {
      var valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
    default : 0
  },{
    type : 'input',
    name : 'scanproportion',
    message : 'YCSB properties-scanproportion',
    validate: function(value) {
      var valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
    default : 0
  },{
    type : 'input',
    name : 'readmodifywriteproportion',
    message : 'YCSB properties-readmodifywriteproportion',
    validate: function(value) {
      var valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
    default : 0
  },{
    type : 'list',
    name : 'requestdistribution',
    message : 'YCSB properties-requestdistribution',
    choices : ['uniform','zipfian','hotspot','sequential','exponential','latest'],
    default : 'uniform'
  },{
    type : 'input',
    name : 'minscanlength',
    message : 'YCSB properties-minscanlength',
    validate: function(value) {
      var valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
    default : 1
  },
  {
    type : 'input',
    name : 'maxscanlength',
    message : 'YCSB properties-maxscanlength',
    validate: function(value) {
      var valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
    default : 1000
  },{
    type : 'list',
    name : 'scanlengthdistribution',
    message : 'YCSB properties-scanlengthdistribution',
    choices : ['uniform','zipfian','hotspot','sequential','exponential','latest'],
    default : 'uniform'
  },{
    type : 'input',
    name : 'insertstart',
    message : 'YCSB properties-insertstart',
    validate: function(value) {
      var valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
    default : 0
  }];

  var q3 = [
    {
    type : 'input',
    name : 'insertcount',
    message : 'YCSB properties-insertcount',
    validate: function(value) {
      var valid = !isNaN(parseFloat(value));
      if(value === 'Record_count value'){
        return true;
      } else {
        return valid || 'Please enter a number';
      }
    },
    filter : Number,
    default : ''
  },{
    type : 'input',
    name : 'zeropadding',
    message : 'YCSB properties-zeropadding',
    validate: function(value) {
      var valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
    default : 1
  },{
    type : 'list',
    name : 'insertorder',
    message : 'YCSB properties-insertorder',
    choices : ['ordered','hashed'],
  },{
    type : 'input',
    name : 'fieldnameprefix',
    message : 'YCSB properties-fieldnameprefix',
    default : 'field'
  },{
    type : 'checkbox',
    name : 'hdrhistogram_percentiles',
    message : 'hdrhistogram - percentiles',
    choices : [
      {
        name : 95,
        filter : Number,
        checked : true
      },{
        name : 99,
        filter : Number,
        checked : true
      },{
        name : 99.99,
        filter : Number
      },{
        name : 99.999,
        filter : Number
      },{
        name : 99.9999,
        filter : Number
      }
    ]
  },{
    type : 'list',
    name : 'hdrhistogram_fileoutput',
    message : 'hdrhistogram.fileoutput',
    choices : ['true','false'],
  },{
    type : 'input',
    name : 'histogram',
    message : 'histogram.buckets',
    validate: function(value) {
      var valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
    default : 1000
  },{
    type : 'input',
    name : 'timeseries',
    message : 'timeseries.granularity',
    validate: function(value) {
      var valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
    default : 1000
  },{
    type : 'input',
    name : 'operationcount',
    message : 'operationcount',
    validate: function(value) {
      var valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
    default : 1
  }
];
//Graph benchmark 속성
var q2 = [
  {
    type : 'input',
    name : 'Create_vertex',
    message : 'Create_vertex properties',
    validate: function(value) {
      var valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
    default : 8.3
  },
  {
    type : 'input',
    name : 'Update_vertex',
    message : 'Update_vertex properties',
    validate: function(value) {
      var valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
    default : 23.8
  },
  {
    type : 'input',
    name : 'Delete_vertex',
    message : 'Delete_vertex properties',
    validate: function(value) {
      var valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
    default : 3.2
  },
  {
    type : 'input',
    name : 'Create_edge',
    message : 'Create_edge properties',
    validate: function(value) {
      var valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
    default : 29.0
  },
  {
    type : 'input',
    name : 'Update_edge',
    message : 'Update_edge properties',
    validate: function(value) {
      var valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
    default : 25.8
  },
  {
    type : 'input',
    name : 'Delete_edge',
    message : 'Delete_edge properties',
    validate: function(value) {
      var valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
    default : 9.6
  },
  {
    type : 'input',
    name : 'SSSP',
    message : 'SSSP',
    validate: function(value) {
      var valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
    default : 0
  },
  {
    type : 'input',
    name : 'Aggregation',
    message : 'Aggregation',
    validate: function(value) {
      var valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
    default : 0
  },
  {
    type : 'input',
    name : 'Neighbors',
    message : 'Neighbors',
    validate: function(value) {
      var valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
    default : 0
  },
  {
    type : 'input',
    name : 'read',
    message : 'read',
    validate: function(value) {
      var valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
    default : 0
  },
  {
    type : 'input',
    name : 'operations',
    message : 'operations',
    validate: function(value) {
      var valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
    default : 1000000
  }
];

inquirer.prompt(question).then(answers => {
    if(answers.type === 'YCSB'){
    inquirer.prompt(q1).then(answers1=>{
        q3[0].default = answers1.Record_count;
      inquirer.prompt(q3).then(answers1_2=>{
        console.log("********************************");
        console.log('type =' +answers.type);
        console.log('File name '+answers.name);
        console.log("----properties----");
        console.log("record count = %s",answers1.Record_count);
        console.log("Field count = %s",answers1.Field_count);
        console.log("fieldlength = %s",answers1.fieldlength);
        console.log("minfieldlength = %s",answers1.minfieldlength);
        console.log("readallfields = %s",answers1.readallfields);
        console.log("writeallfields = %s",answers1.writeallfields);
        console.log("readproportion = %s",answers1.readproportion);
        console.log("updateproportion = %s",answers1.updateproportion);
        console.log("insertproportion = %s",answers1.insertproportion);
        console.log("scanproportion = %s",answers1.scanproportion);
        console.log("readmodifywriteproportion = %s",answers1.readmodifywriteproportion);
        console.log("requestdistribution = %s",answers1.requestdistribution);
        console.log("minscanlength = %s",answers1.minscanlength);
        console.log("maxscanlength = %s",answers1.maxscanlength);
        console.log("scanlengthdistribution = %s",answers1.scanlengthdistribution);
        console.log("insertstart = %s",answers1.insertstart);
        console.log("insertcount = %s",answers1_2.insertcount);
        console.log("zeropadding = %s",answers1_2.zeropadding);
        console.log("insertorder = %s",answers1_2.insertorder);
        console.log("fieldnameprefix = %s",answers1_2.fieldnameprefix);
        console.log("hdrhistogram.percentiles = %s",answers1_2.hdrhistogram_percentiles);
        console.log("hdrhistogram.fileoutput = %s",answers1_2.hdrhistogram_fileoutput);
        console.log("histogram = %s",answers1_2.histogram);
        console.log("timeseries.granularity = %s",answers1_2.timeseries);
        console.log("operationcount = %s",answers1_2.operationcount);
        console.log('workload=site.ycsb.workloads.CoreWorkload');
        console.log("********************************");

        var aa = ['type = '+answers.type+'\n'+
        'recordcount = '+answers1.Record_count+'\n'+
        'fieldcount = '+answers1.Field_count+'\n'+
        'fieldlength = '+answers1.fieldlength+'\n'+
        'minfieldlength = '+answers1.minfieldlength+'\n'+
        'readallfields = '+answers1.readallfields+'\n'+
        'writeallfields = '+answers1.writeallfields+'\n'+
        'readproportion = '+answers1.readproportion+'\n'+
        'updateproportion = '+answers1.updateproportion+'\n'+
        'insertproportion = '+answers1.insertproportion+'\n'+
        'scanproportion = '+answers1.scanproportion+'\n'+
        'readmodifywriteproportion = '+answers1.readmodifywriteproportion+'\n'+
        'requestdistribution = '+answers1.requestdistribution+'\n'+
        'minscanlength = '+answers1.minscanlength+'\n'+
        'maxscanlength = '+answers1.maxscanlength+'\n'+
        'scanlengthdistribution = '+answers1.scanlengthdistribution+'\n'+
        'insertstart = '+answers1.insertstart+'\n'+
        'insertcount = '+answers1_2.insertcount+'\n'+
        'zeropadding = '+answers1_2.zeropadding+'\n'+
        'insertorder = '+answers1_2.insertorder+'\n'+
        'fieldnameprefix = '+answers1_2.fieldnameprefix+'\n'+
        'hdrhistogram_percentiles = '+answers1_2.hdrhistogram_percentiles+'\n'+
        'hdrhistogram_fileoutput = '+answers1_2.hdrhistogram_fileoutput+'\n'+
        'histogram = '+answers1_2.histogram+'\n'+
        'timeseries_granularity = '+answers1_2.timeseries+'\n'+
        'operationcount = '+answers1_2.operationcount+'\n'+
        'workload=site.ycsb.workloads.CoreWorkload'
      ];
          fs.readdir(dir1,function(err,filelist){
            for(i=0;i<filelist.length;i++){
              if(filelist[i]===answers.name){
                answers.name = answers.name+'0';
              }
            }
            fs.writeFile(dir1 + answers.name,aa,'utf-8',(err) => {
              if(err){
                console.log(err);
              }else {
                console.log('file name = '+answers.name);
              }
            });
          });
       })
    })
  } else {
    inquirer.prompt(q2).then(answers2 => {
      console.log("********************************");
      console.log("type ="+answers.type);
      console.log("File name ="+answers.name);
      console.log("----properties----");
      console.log("Create_vertex ="+answers2.Create_vertex);
      console.log("Update_vertex ="+answers2.Update_vertex);
      console.log("Delete_vertex ="+answers2.Delete_vertex);
      console.log("Create_edge ="+answers2.Create_edge);
      console.log("Update_edge ="+answers2.Update_edge);
      console.log("Delete_edge ="+answers2.Delete_edge);
      console.log("SSSP ="+answers2.SSSP);
      console.log("Aggregation ="+answers2.Aggregation);
      console.log("Neighbors ="+answers2.Neighbors);
      console.log("read ="+answers2.read);
      console.log("operations ="+answers2.operations);
      console.log("********************************");

      var bb = ["type ="+answers.type+'\n'+
      "File name ="+answers.name+'\n'+
      "Create_vertex ="+answers2.Create_vertex+'\n'+
      "Update_vertex ="+answers2.Update_vertex+'\n'+
      "Delete_vertex ="+answers2.Delete_vertex+'\n'+
      "Create_edge ="+answers2.Create_edge+'\n'+
      "Update_edge ="+answers2.Update_edge+'\n'+
      "Delete_edge ="+answers2.Delete_edge+'\n'+
      "SSSP ="+answers2.SSSP+'\n'+
      "Aggregation ="+answers2.Aggregation+'\n'+
      "Neighbors ="+answers2.Neighbors+'\n'+
      "read ="+answers2.read+'\n'+
      "operations ="+answers2.operations];
      fs.readdir(dir2,function(err,filelist){
        console.log(dir2);
        for(i=0;i<filelist.length;i++){
          if(filelist[i]===answers.name){
            answers.name = answers.name+'0';
          }
        }
        fs.writeFile(dir2 + answers.name,bb,(err) => {
          if(err){
            console.log(err);
          }else {
            console.log('file name = '+answers.name);
          }
        });
      });
    });
  }
  }
);
