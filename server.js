const http = require("http");

http.get("http://203.255.92.193:8529/_admin/cluster/health", res => {
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
            console.log("Status: Node ID");
            for (node in parsedData.Health) {
                console.log(parsedData.Health[node].Status + ": " + node);
                if(parsedData.Health[node].Status==='good'){
                  ++good;
                }
            }
            if(good=9){
              console.log('Status is complete',good);
            }
        } catch(err) {
            console.log("Error: " + err.message);
        }
    });

    res.on("error", err => {
        console.log("Error: " + err.message);
    });
});
