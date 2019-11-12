var fs = require('fs');
var path = require('path');
var bodyParser = require("body-parser");
var json2xml = require("js2xmlparser");
var sqlite3 = require('sqlite3');

// NPM modules
var express = require('express');
var app = express();
var port = 8000;
var dir = __dirname;
var db_filename = path.join(__dirname, 'db', 'stpaul_crime.sqlite3');

var users;
app.use(bodyParser.urlencoded({extended: true}));

var db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
    }
});

app.get('/codes', (req, res) =>
{
    new Promise((resolve, reject) =>
    {
        if(req.query.hasOwnProperty("code"))
        {
            var code_array = req.query.code.split(",");
            var dbcall = "SELECT * FROM codes WHERE code=?";
            for(let i = 1; i < code_array.length; i++)
            {
                dbcall = dbcall + " OR code=?";
            }
            dbcall = dbcall + " ORDER BY code";
            db.all(dbcall, code_array, (err, row) =>
            {
                var result = {};
                if(err)
                {
                    reject(err);
                }
                else
                {
                    for(let i = 0; i < row.length; i++)
                    {
                        result["C"+row[i]["code"]] = row[i]["incident_type"];
                    }
                }
                //console.log(JSON.stringify(result));
                resolve(result);
            });
            //console.log(code_array);
        }
        else
        {
            db.all("SELECT * FROM Codes ORDER BY code", (err, row) =>
            {
                var result = {};
                if(err)
                {
                    reject(err);
                }
                else
                {
                    for(let i = 0; i < row.length; i++)
                    {
                        result["C"+row[i]["code"]] = row[i]["incident_type"];
                    }
                }
                //console.log(JSON.stringify(result));
                resolve(result);
            });
        }
    }).then((data) =>
    {
        if(req.query.hasOwnProperty("format") && req.query.format.toLowerCase() === "xml")
        {
            res.type("xml").send(json2xml.parse("codes", data));
        }
        else
        {
            res.type("json").send(data);
        }
    });
});


app.get('/neighborhoods', (req, res) => 
{
    new Promise((resolve, reject) =>
    {
        if(req.query.hasOwnProperty("id"))
        {
            var id_array = req.query.id.split(",");
            var dbcall = "SELECT * FROM Neighborhoods WHERE neighborhood_number=?";
            for(let i = 1; i < id_array.length; i++)
            {
                dbcall = dbcall + " OR neighborhood_number=?";
            }
            dbcall = dbcall + " ORDER BY neighborhood_number";
            db.all(dbcall, id_array, (err, row) =>
            {
                var result = {};
                if(err)
                {
                    reject(err);
                }
                else
                {
                    for(let i = 0; i < row.length; i++)
                    {
                        result["C"+row[i]["neighborhood_number"]] = row[i]["neighborhood_name"];
                    }
                }
                //console.log(JSON.stringify(result));
                resolve(result);
            });
            //console.log(code_array);
        }
        else
        {
            db.all("SELECT * FROM Neighborhoods ORDER BY neighborhood_number", (err, row) =>
            {
                var result = {};
                if(err)
                {
                    reject(err);
                }
                else
                {
                    for(let i = 0; i < row.length; i++)
                    {
                        result["N"+row[i]["neighborhood_number"]] = row[i]["neighborhood_name"];
                    }
                }
                //console.log(JSON.stringify(result));
                resolve(result);
            });
        }
    }).then((data) =>
    {
        if(req.query.hasOwnProperty("format") && req.query.format.toLowerCase() === "xml")
        {
            res.type("xml").send(json2xml.parse("Neighborhoods", data));
        }
        else
        {
            res.type("json").send(data);
        }
    });
});

app.get('/incidents', (req, res) =>
{
    new Promise((resolve, reject) =>
    {
        if(req.query.hasOwnProperty("id"))
        {
            var code_array = req.query.code.split(",");
            //console.log(code_array);
        }
        else
        {
            db.all("SELECT * FROM Incidents ORDER BY date_time DESC", (err, row) =>
            {
                var result = {};
                if(err)
                {
                    reject(err);
                }
                else
                {
                    for(let i = 0; i < row.length; i++)
                    {
                        let datetimearray = row[i]["date_time"].split("T");
                        result["I"+row[i]["case_number"]] = 
                        {
                            "date": datetimearray[0],
                            "time": datetimearray[1].substring(0, datetimearray[1].indexOf(".")),
                            "code": row[i]["neighborhood_name"],
                            "incident": row[i]["incident"],
                            "police_grid": row[i]["police_grid"],
                            "neighborhood_number": row[i]["neighborhood_number"],
                            "block": row[i]["block"]
                        }
                    }
                }
                //console.log(JSON.stringify(result));
                resolve(result);
            });
        }
    }).then((data) =>
    {
        if(req.query.hasOwnProperty("format") && req.query.format.toLowerCase() === "xml")
        {
            res.type("xml").send(json2xml.parse("Neighborhoods", data));
        }
        else
        {
            res.type("json").send(data);
        }
    });
});

app.put('/new-incident', (req, res) =>
{
    var new_obj = {users: []};
    if(req.query.hasOwnProperty("limit"))
    {
        for(let i = 0; i < Math.min(parseInt(req.query.limit, 10), users.users.length); i++)
        {
            new_obj.users.push(users.users[i]);
        }
    }
    else
    {
        for(let i = 0; i < users.users.length; i++)
        {
            new_obj.users.push(users.users[i]);
        }
    }
    var result;
    if(req.query.hasOwnProperty("format") && req.query.format.toLowerCase() === "xml")
    {
        result = convert("userlist", new_obj);
        res.type("json").send(result);
    }
    else
    {
        res.type("json").send(new_obj);
    }
});
var server = app.listen(port);
console.log("Now listening on Port: " + port);