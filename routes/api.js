const express = require('express');
const router = express.Router();
const request = require("request");
const parser = require('xml2json');
const csv = require("csvtojson");
const fs = require("fs")
const {tableauBaseUrl,myCache,siteName} = require("../bin/settings")


const options = {
    object: true,
    reversible: false,
    coerce: false,
    sanitize: true,
    trim: true,
    arrayNotation: false,
    alternateTextNode: false
};


router.post('/login', (req, res) => {

    let username = req.body.username
    let password = req.body.password

    let isEmailError = username ? false : true 
    let isPasswordError = password ? false : true

    if (isEmailError || isPasswordError){
        res.send({
            emailError :isEmailError, 
            passwordError : isPasswordError 
        })
        return
    }
        

    let loginXmlData = `<tsRequest>
                            <credentials name="${username}" password="${password}" >
                            <site contentUrl="${siteName}" />
                            </credentials>
                        </tsRequest>`

    request({
            url:`${tableauBaseUrl}/api/3.6/auth/signin`,
            port: 80,
            method:"POST",
            headers:{
                'Content-Type': 'application/xml',
            },
            body: loginXmlData
        },
        function(error, response, body){

            if(error){
                res.send({"error":error})
                return
            }
            
            let json = parser.toJson(body,options);
            let tsResponseElement = json["tsResponse"]
            let credentials = tsResponseElement["credentials"]
            let token = credentials ? credentials["token"] : ''
            let site = credentials ? credentials["site"] : ''
            let siteID = site ? site["id"] : ''
            let user = credentials ? credentials["user"] : ''
            let userID = user ? user["id"] : ''
            myCache.set( "token", token, 14400 );
            myCache.set( "siteID", siteID, 14400 );
            myCache.set( "userID", userID, 14400 );

            if(token){
                res.send({status:'logged in',success:true})
            }
            else{
                res.send({error:'Please register on tableau'})
            }  
            
        }
    );    
});


router.get('/workbooks', (req, res) => {
    let token = myCache.get("token")
    let siteID = myCache.get("siteID")
    let userID = myCache.get("userID")

    if (!token || !siteID || !userID){
        res.send({error:'cache not set'})
        return
    }

    request({
            url:`${tableauBaseUrl}/api/3.6/sites/${siteID}/users/${userID}/workbooks`,
            port: 80,
            method:"GET",
            headers:{
                'X-Tableau-Auth': token,
            },
        },
        function(error, response, body){

            if(error){
                res.send({"error":error})
                return
            }

            let json = parser.toJson(body,options);
            let tsResponseElement = json["tsResponse"]
            let workbookJSOn = tsResponseElement["workbooks"]
            myCache.set( "workbookJSOn", workbookJSOn, 14400 );

            res.send(workbookJSOn)
            
        }
    );    

})

router.get('/workbook/:workbookID/views', (req, res) => {
    let token = myCache.get("token")
    let siteID = myCache.get("siteID")
    let workbookID = req.params.workbookID

    if (!token || !siteID ){
        res.send({error:'cache not set'})
        return
    }

    request({
            url:`${tableauBaseUrl}/api/3.6/sites/${siteID}/workbooks/${workbookID}/views`,
            port: 80,
            method:"GET",
            headers:{
                'X-Tableau-Auth': token,
            },
        },
        function(error, response, body){

            if(error){
                res.send({"error":error})
                return
            }
            
            let json = parser.toJson(body,options);
            let tsResponseElement = json["tsResponse"]
            let viewsJSOn = tsResponseElement["views"]
            myCache.set( "viewsJSOn", viewsJSOn, 14400 );

            res.send(viewsJSOn)
            
        }
    );    

})

router.get('/workbook/:workbookID/views/:viewID/filterData', (req,res) => {
    let viewID = req.params.viewID;
    let filterNameList = req.query.filterNameList
    let token = myCache.get("token")
    let siteID = myCache.get("siteID")

    if (!token || !siteID ){
        return {err:'No token or siteId'}
    }

    let result = {}

    if(myCache.has(`view-${viewID}`)){
        data = myCache.get(`view-${viewID}`)
        filterNameList.forEach(item => result[item] = data[item])
        res.send(result)
        return
    }

    request(
        {
            url:`${tableauBaseUrl}/api/3.6/sites/${siteID}/views/${viewID}/data`,
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
                let data = csvRow[0].map((col, i) => Array.from(new Set(csvRow.map(row => row[i]))))
                dataDict = {}
                for(row of data){
                    dataDict[`${row[0]}`] = row.slice(1)
                }
                myCache.set(`view-${viewID}`,dataDict,14400)
                filterNameList.forEach(item => result[item] = dataDict[item])
                res.send(result)
            })
            
        }
    );  
})

router.get('/views/:viewID/image', (req,res) => {
    let viewID = req.params.viewID;
    let filterNameList = req.query.filterNameList
    let token = myCache.get("token")
    let siteID = myCache.get("siteID")

    if (!token || !siteID ){
        return {err:'No token or siteId'}
    }

    let result = {}

    if(myCache.has(`view-${viewID}`)){
        data = myCache.get(`view-${viewID}`)
        filterNameList.forEach(item => result[item] = data[item])
        res.send(result)
        return
    }

    request(
        {
            url:`${tableauBaseUrl}/api/3.6/sites/${siteID}/views/${viewID}/image`,
            port: 80,
            method:"GET",
            encoding: 'base64',
            headers:{
                'X-Tableau-Auth': token,
            },
        },
        function(error, response, body){

            if(error){
                console.log("Error in fetching data source")
                return
            }
            res.send(body)

        }
    );  
})


module.exports = router;
