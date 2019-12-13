var fs = require('fs');
var path = require('path');
var bodyParser = require("body-parser");
var json2xml = require("js2xmlparser");
var sqlite3 = require('sqlite3');

var myArgs = process.argv.slice(2);

// NPM modules
var express = require('express');
var app = express();
var dir = __dirname;
var db_filename = path.join(__dirname, 'db', 'stpaul_crime.sqlite3');

if(myArgs.length > 0)
{
    var port = myArgs[0];
}
else
{
    var port = 8000;
}
var users;
app.use(bodyParser.urlencoded({extended: true}));

//opens the database
var db = new sqlite3.Database(db_filename, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
    }
});

//this app.get gets the codes from the database
app.get('/codes', (req, res) =>
{
    new Promise((resolve, reject) =>
    {
        //this if handles if we have a query to access specific codes
        if(req.query.hasOwnProperty("code"))
        {
            /*here we are dynamically creating our database call based on 
            on how many codes were entered. we put all the codes into 
            an array using split, and we use a for loop to put the correct
            amount of code=? in our database call*/
            var code_array = req.query.code.split(",");
            var dbcall = "SELECT * FROM codes WHERE code=?";
            for(let i = 1; i < code_array.length; i++)
            {
                dbcall = dbcall + " OR code=?";
            }
            dbcall = dbcall + " ORDER BY code";
            /*this calls our databse to get back the specified codes. Once we 
            have the codes, we put them into a json object*/
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
            //if specific codes are not specified, then we just do the database call and create our json object
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
        /*when we have the data, what we do is check to see if they want it in json or xml
        format. Once we have converted the data to the correct form, we send it to the page*/
        if(req.query.hasOwnProperty("format") && req.query.format.toLowerCase() === "xml")
        {
            res.type("xml").send(json2xml.parse("codes", data));
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

//this app.get gets the neighborhoods from the database
app.get('/neighborhoods', (req, res) => 
{
     //this if handles if we have a query to access specific neighborhood id
    new Promise((resolve, reject) =>
    {
        /*here we are dynamically creating our database call based on 
            on how many ids were entered. we put all the ids into 
            an array using split, and we use a for loop to put the correct
            amount of neighborgood_number=? in our database call*/
        if(req.query.hasOwnProperty("id"))
        {
            var id_array = req.query.id.split(",");
            var dbcall = "SELECT * FROM Neighborhoods WHERE neighborhood_number=?";
            for(let i = 1; i < id_array.length; i++)
            {
                dbcall = dbcall + " OR neighborhood_number=?";
            }
            dbcall = dbcall + " ORDER BY neighborhood_number";
            /*this calls our databse to get back the specified neighborhood numbers. Once we 
            have the numbers, we put them into a json object*/
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
            //if specific ids are not specified, then we just do the database call and create our json object
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
        /*when we have the data, what we do is check to see if they want it in json or xml
        format. Once we have converted the data to the correct form, we send it to the page*/
        if(req.query.hasOwnProperty("format") && req.query.format.toLowerCase() === "xml")
        {
            res.type("xml").send(json2xml.parse("Neighborhoods", data));
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

//this app.get gets the incidents from the database
app.get('/incidents', (req, res) =>
{
    new Promise((resolve, reject) =>
    {
        /*the first thing we do in this request is build our database string
        and result array based on what queries we have. We do this in the exact
        same manner as we did above. If we have a certain query, we push how many we
        have to the result array, and put that many thing=? in our database string. The
        difference is we have to check and see in each one if a where has been added to the
        database string. If it hasnt, then we need to add one, along with how many thing=? we 
        need.*/
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
        //Now we have our database call, where we create the json object we need to send
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
                /*here we calculate if there has been a query for a limit. If there is no limit,
                we default to 10000*/
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
                        //what we do here is split up the date and time based on if we have one or both
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
                        //this is where we create our json object
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
        //this is where we determine the correct format and send the data
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

//this puts a new incident into our database
app.put('/new-incident', (req, res) =>
{
    if(req.body.hasOwnProperty("case_number") == false)
    {
        res.status(500).send("Need a case number.");
    }
    /*what we do is create an object that holds each field we can enter to put
    into the database, and then we have ifs that check to see if we have entered
    one of those fields, and if we have, put it in the json object*/
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
    //this is where we open our database to make sure that the case number we are entering does not already exist
    db.all("SELECT * FROM Incidents WHERE case_number=?", [new_obj.case_number], (err, row) =>
    {
        if(row.length > 0)
        {
            res.status(500).send("Case Number already exists.");
        }
        else if(err)
        {
            res.status(500).send("error accessing database");
        }
        else
        {
            //if the case number does not exist, then we add the data to the database
            db.run("INSERT INTO incidents (case_number, date_time, code, incident, police_grid, neighborhood_number, block) VALUES (?, ?, ?, ?, ?, ?, ?)", [new_obj.case_number, new_obj.date_time, new_obj.code, new_obj.incident, new_obj.police_grid, new_obj.neighborhood_number, new_obj.block], (err) =>
            {
                if(err)
                {
                    res.status(500).send("error inserting value into database");
                    console.log("error putting in value into database");
                    console.log(err);
                }
                else
                {
                    res.send("successfully added incident.");
                }
            });
        }

    });

});
var server = app.listen(port);
console.log("Now listening on Port: " + port);
