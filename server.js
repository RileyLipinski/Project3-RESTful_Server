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

var db = new sqlite3.Database(db_filename, sqlite3.OPEN_READWRITE, (err) => {
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
                resolve(result);
            });
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
                resolve(result);
            });
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
        var dbcall = "SELECT * FROM Incidents";
        var result_array = [];
        var is_where = false;
        if(req.query.hasOwnProperty("start_date"))
        {
            if(is_where == false)
            {
                dbcall = dbcall + " WHERE date_time>=? ";
                is_where = true;
                result_array.push(req.query.start_date);
            }
            else
            {
                dbcall = dbcall + "AND date_time>=? ";
                result_array.push(req.query.start_date);
            }
        }
        if(req.query.hasOwnProperty("end_date"))
        {
            if(is_where == false)
            {
                dbcall = dbcall + " WHERE date_time<=? ";
                is_where = true;
                result_array.push(req.query.end_date);
            }
            else
            {
                dbcall = dbcall + "AND date_time<=? ";
                result_array.push(req.query.end_date);
            }
        }
        // if(req.query.hasOwnProperty("start_date") == false && req.query.hasOwnProperty("end_date") == false)
        // {
        //     if(is_where == false)
        //     {
        //         console.log("uhhh");
        //     }
        // }
        if(req.query.hasOwnProperty("code"))
        {
            let code_array = req.query.code.split(",");
            if(is_where == false)
            {
                dbcall = dbcall + " WHERE (code=? ";
                for(let i = 1; i < code_array.length; i++)
                {
                    dbcall = dbcall + " OR code=?";
                }
                dbcall = dbcall + ") ";
                for(let i = 0; i < code_array.length; i++)
                {
                    result_array.push(code_array[i]);
                }
                is_where = true;
            }
            else
            {
                dbcall = dbcall + "AND (code=?";
                for(let i = 1; i < code_array.length; i++)
                {
                    dbcall = dbcall + " OR code=?";
                }
                dbcall = dbcall + ") ";
                for(let i = 0; i < code_array.length; i++)
                {
                    result_array.push(code_array[i]);
                }
            }
        }
        if(req.query.hasOwnProperty("grid"))
        {
            let grid_array = req.query.grid.split(",");
            if(is_where == false)
            {
                dbcall = dbcall + " WHERE (police_grid=? ";
                for(let i = 1; i < grid_array.length; i++)
                {
                    dbcall = dbcall + " OR police_grid=?";
                }
                dbcall = dbcall + ") ";
                for(let i = 0; i < grid_array.length; i++)
                {
                    result_array.push(grid_array[i]);
                }
                is_where = true;
            }
            else
            {
                dbcall = dbcall + "AND (police_grid=?";
                for(let i = 1; i < grid_array.length; i++)
                {
                    dbcall = dbcall + " OR police_grid=?";
                }
                dbcall = dbcall + ") ";
                for(let i = 0; i < grid_array.length; i++)
                {
                    result_array.push(grid_array[i]);
                }
            }
        }
        if(req.query.hasOwnProperty("id"))
        {
            let id_array = req.query.id.split(",");
            if(is_where == false)
            {
                dbcall = dbcall + " WHERE (neighborhood_number=? ";
                for(let i = 1; i < id_array.length; i++)
                {
                    dbcall = dbcall + " OR neighborhood_number=?";
                }
                dbcall = dbcall + ") ";
                for(let i = 0; i < id_array.length; i++)
                {
                    result_array.push(id_array[i]);
                }
                is_where = true;
            }
            else
            {
                dbcall = dbcall + "AND (neighborhood_number=?";
                for(let i = 1; i < id_array.length; i++)
                {
                    dbcall = dbcall + " OR neighborhood_number=?";
                }
                dbcall = dbcall + ") ";
                for(let i = 0; i < id_array.length; i++)
                {
                    result_array.push(id_array[i]);
                }
            }
        }
        dbcall = dbcall + " ORDER BY date_time DESC";
        db.all(dbcall, result_array, (err, row) =>
        {
            var result = {};
            if(err)
            {
                reject(err);
            }
            else if(row.length <= 0)
            {
                res.status(500).send("Nothing with such queries exists.");
            }
            else
            {
                var limit = row.length;
                if(req.query.hasOwnProperty("limit"))
                {
                    limit = parseInt(req.query.limit);
                    if(limit > row.length)
                    {
                        limit = row.length;
                    }
                }
                else
                {
                    limit = 10000;
                }
                for(let i = 0; i < limit; i++)
                {
                    if(row[i] != undefined)
                    {
                        let datetimearray = [];
                        if(row[i]["date_time"].indexOf("T") >= 0)
                        {
                            datetimearray = row[i]["date_time"].split("T");
                        }
                        else if(row[i]["date_time"].indexOf("-") >= 0)
                        {
                            datetimearray = [row[i]["date_time"], ""];
                        }
                        else if(row[i]["date_time"].indexOf(":") >= 0)
                        {
                            datetimearray = ["", row[i]["date_time"]];
                        }
                        else
                        {
                            datetimearray = ["", ""];
                        }
                        if(datetimearray[1].indexOf(".") >= 0)
                        {
                            datetimearray[1] = datetimearray[1].substring(0, datetimearray[1].indexOf("."));
                        }
                        result["I"+row[i]["case_number"]] = 
                        {
                            "date": datetimearray[0],
                            "time": datetimearray[1],
                            "code": row[i]["code"],
                            "incident": row[i]["incident"],
                            "police_grid": row[i]["police_grid"],
                            "neighborhood_number": row[i]["neighborhood_number"],
                            "block": row[i]["block"]
                        }
                    }
                }
            }
            resolve(result);
        });
    }).then((data) =>
    {
        if(req.query.hasOwnProperty("format") && req.query.format.toLowerCase() === "xml")
        {
            res.type("xml").send(json2xml.parse("incidents", data));
        }
        else
        {
            res.type("json").send(data);
        }
    }).catch((err) =>
    {
        res.status(500).send("An error has occurred. Check query syntax.");
    });
});

app.put('/new-incident', (req, res) =>
{
    if(req.body.hasOwnProperty("case_number") == false)
    {
        res.status(500).send("Need a case number.");
    }
    var new_obj = 
    {
        case_number: req.body.case_number,
        date_time: "",
        code: "",
        incident: "",
        police_grid: "",
        neighborhood_number: "",
        block: ""
    }
    if(req.body.hasOwnProperty("date"))
    {
        new_obj["date_time"] = req.body.date;
    }
    if(req.body.hasOwnProperty("time"))
    {
        new_obj["date_time"] = new_obj.date_time + "T" + req.body.time;
    }
    if(req.body.hasOwnProperty("code"))
    {
        new_obj["code"] = parseInt(req.body.code);
    }
    if(req.body.hasOwnProperty("incident"))
    {
        new_obj["incident"] = req.body.incident;
    }
    if(req.body.hasOwnProperty("police_grid"))
    {
        new_obj["police_grid"] = parseInt(req.body.police_grid);
    }
    if(req.body.hasOwnProperty("neighborhood_number"))
    {
        new_obj["neighborhood_number"] = parseInt(req.body.neighborhood_number);
    }
    if(req.body.hasOwnProperty("block"))
    {
        new_obj["block"] = req.body.block;
    }
    db.all("SELECT * FROM Incidents WHERE case_number=?", [new_obj.case_number], (err, row) =>
    {
        if(row.length > 0)
        {
            res.status(500).send("Case Number already exists.");
        }
        if(err)
        {
            res.status(500).send("error accessing database");
        }

    });
    db.run("INSERT INTO incidents (case_number, date_time, code, incident, police_grid, neighborhood_number, block) VALUES (?, ?, ?, ?, ?, ?, ?)", [new_obj.case_number, new_obj.date_time, new_obj.code, new_obj.incident, new_obj.police_grid, new_obj.neighborhood_number, new_obj.block], (err) =>
    {
        if(err)
        {
            res.status(500).send("error inserting value into database");
            console.log("error putting in value into database");
            console.log(err);
        }
    });
});
var server = app.listen(port);
console.log("Now listening on Port: " + port);