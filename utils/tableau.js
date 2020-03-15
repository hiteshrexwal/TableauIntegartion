const request = require('request');
const csv=require("csvtojson");
const {tableauBaseUrl,myCache} = require("../bin/settings")


async function getViewData() 
{
    let token = myCache.get("token")
    let siteID = myCache.get("siteID")
    let viewsJSOn = myCache.get("viewsJSOn")

    if (!token || !siteID || !viewsJSOn){
        return
    }

    await new Promise (resolve => {
        for(view of viewsJSOn['view']){

            if(myCache.get(`${view.viewUrlName}-data`)){
                return
            }

            request(
                {
                    url:`${tableauBaseUrl}/api/3.6/sites/${siteID}/views/${view.id}/data`,
                    port: 80,
                    method:"GET",
                    headers:{
                        'X-Tableau-Auth': token,
                    },
                },
                function(error, response, body){

                    if(error){
                        console.log("Error in fetching data source")
                        return
                    }

                    csv({
                        noheader:true,
                        output: "csv"
                    })
                    .fromString(body)
                    .then((csvRow)=>{ 
                        myCache.set(`${view.viewUrlName}-data`,csvRow[0].map((col, i) => new Set(csvRow.map(row => row[i]))),14400);
                    })
                    
                }
            );  
        }
    })
    
}


module.exports.getViewData = getViewData