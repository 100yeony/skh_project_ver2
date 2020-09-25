const PropertiesReader = require('properties-reader');

const properties = PropertiesReader('./InstallConfig');
// const properties = PropertiesReader('./InstallConfig_homedir');

module.exports = {
  // [project directory]
  get_server_homedir(){
   return properties.get("server_homedir")
  },
  get_node_homedir(){
   return properties.get("node_homedir")
  },


  // [cluster info (,뒤에 띄어쓰기 안함)]
  get_server_IP(){
    return properties.get("server_IP");
  },
  get_nodes_IP(){
    return properties.get("nodes_IP");
  },
  get_nodetool_IP(){
    return properties.get("nodetool_IP");
  },
  get_orientMaster_IP(){
    return properties.get("orientMaster_IP");
  },


  // [server directory]
  get_server_install_dir(){
    return properties.get("server_install_dir");
  },
  get_server_WLgenerate_dir(){
    return properties.get("server_WLgenerate_dir")
  },
  get_server_file1_dir(){
    return properties.get("server_file1_dir")
  },
  get_server_file2_dir(){
    return properties.get("server_file2_dir")
  },
  get_server_file3_dir(){
    return properties.get("server_file3_dir")
  },


  //  [node directory]
  get_node_install_dir(){
    return properties.get("node_install_dir");
  },


  // [ycsb]
  get_ycsb_exporter(){
    return properties.get("ycsb_exporter")
  },
  get_ycsb_exportfile_dir(){
    return properties.get("ycsb_exportfile_dir")
  },


  // [IO Tracer]
  get_IO_output_dir(){
    return properties.get("IO_output_dir");
  },
  get_IO_driverManager_dir(){
    return properties.get("IO_driverManager_dir");
  },
  get_IO_tracer_dir(){
    return properties.get("IO_tracer_dir");
  },
  get_IO_watch_dir(){
    return properties.get("IO_watch_dir");
  },


  // [package]
  get_javaVersion(){
    return properties.get("java_version");
  },
  get_pythonVersion(){
    return properties.get("python_version");
  },
  get_mavenVersion(){
    return properties.get("maven_version");
  },


  // [cassandra]
 get_server_cassandra_dir(){
   return properties.get("server_cassandra_dir")
 },
 get_node_cassandra_dir(){
   return properties.get("node_cassandra_dir")
 },
 //update_configuration_path_server
 get_update_conf_path(){
   return properties.get("update_conf_path")
 },


 // [orientdb]
 get_nosqltests_result_dir(){
   return properties.get("nosqltests_result_dir")
  },


 // [arangodb]
  get_node_arangodb_dir(){
    return properties.get("node_arangodb_dir")
  },
  get_node_arangodb_data_dir(){
    return properties.get("node_arangodb_data_dir")
  },
 

}
