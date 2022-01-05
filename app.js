require("dotenv").config();
const express = require("express");
const { Client } = require("pg");

const app = express();

const client = new Client({
  host: process.env.HOST,
  user: process.env.USER,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
});

app.get("/", (_, res) => {
  res.send("assignment-infiniticube");
});

app.get("/orders", (req, res) => {
  let numRows;
  let numPerPage = parseInt(req.query.limit, 10) || 1;
  let page = parseInt(req.query.page, 10) || 0;
  let numPages;
  let skip = page * numPerPage;
  let limit = skip + numPerPage;
  const { user_id } = req.query;

  client
    .query("select count(*) from orders")
    .then((results) => {
      numRows = results.rows[0].count;
      numPages = Math.floor(numRows / numPerPage);
      console.log("number of pages:", numPages);
    })
    .then(() =>
      client.query(
        `SELECT * from orders where user_id=${user_id} limit ${limit}`
      )
    )
    .then((results) => {
      const responsePayload = {
        results,
      };

      if (page < numPages) {
        responsePayload.pagination = {
          current: page,
          perPage: numPerPage,
          previous: page > 1 ? page - 1 : undefined,
          next: page < numPages - 1 ? page + 1 : undefined,
        };
      } else
        responsePayload.pagination = {
          err:
            "queried page " +
            page +
            " is >= to maximum page number " +
            numPages,
        };
      res.json({
        Total: numRows,
        Data: responsePayload.results.rows,
      });
    })
    .catch(function (err) {
      console.error(err);
      res.json({ err: err });
    });
});

app.get("/users", (req, res) => {
  let numRows;
  let numPerPage = parseInt(req.query.limit, 10) || 1;
  let page = parseInt(req.query.page, 10) || 1;
  let numPages;
  let skip = page * numPerPage;
  let limit = skip + numPerPage;

  client
    .query(
      `select * from users left join orders on users.id = orders.user_id limit ${limit}`
    )
    .then((results) => {
      numRows = results.rowCount;
      numPages = Math.floor(numRows / numPerPage);
      console.log("number of pages:", numPages);
      const responsePayload = {
        results,
      };

      if (page < numPages) {
        responsePayload.pagination = {
          current: page,
          perPage: numPerPage,
          previous: page > 1 ? page - 1 : undefined,
          next: page < numPages - 1 ? page + 1 : undefined,
        };
      } else
        responsePayload.pagination = {
          err:
            "queried page " +
            page +
            " is >= to maximum page number " +
            numPages,
        };
      res.json({
        Total: numRows,
        Data: responsePayload.results.rows,
      });
    })
    .catch(function (err) {
      console.error(err);
      res.json({ err: err });
    });
});

app.listen(4000, async () => {
  await client.connect().then(() => console.log("Database Connected"));
  console.log("Server running ");
});
