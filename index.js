require('dotenv').config();

const aws = require('aws-sdk');
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 5000;
app.set('view engine', 'ejs'); // Set EJS as the templating engine
// app.set('views', './views'); // Set the views directory (optional if in default location)

app.use(express.urlencoded({extended:true}));
app.use(express.json());

let awsConfig = {
    "region":process.env.AWS_REGION,
    "endpoint": "https://dynamodb.eu-north-1.amazonaws.com",
    "accessKeyId":process.env.AWS_ACCESS_KEY_ID,
    "secretAccessKey":process.env.AWS_SECRET_ACCESS_KEY
};

aws.config.update(awsConfig);
const docClient = new aws.DynamoDB.DocumentClient();



app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let items = [];

app.get("/", async (req, res) => {
  try{

  const params = {
TableName: 'toDo'
};

docClient.scan(params, (err, data) => {
if (err) {
    console.error('Unable to scan the table. Error:', JSON.stringify(err, null, 2));
    res.status(500).send('Unable to fetch posts');
} else {
  res.render("index.ejs", {
    listTitle: "Today",
    listItems: data.Items,
  });
    
}
});

}
catch(error){
console.log(error);

}
  
});

app.post("/add", async (req, res) => {
  var date = new Date();
    var dd = String(date.getDate()).padStart(2, '0');
    var mm = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = date.getFullYear();
    date = dd + '/' + mm + '/' + yyyy;
  const item = req.body.newItem;
  //items.push({ title: item });

  try{
   // await db.query("INSERT INTO items (title) VALUES ($1)",[item]);
    //res.redirect("/");
    const newEntry = {
      id:uuidv4(),
      title: item,
      dateCreated: date
  };
  const params = {
    TableName: 'toDo', // Replace with your DynamoDB table name
    Item: newEntry
};

  // Insert the new entry into DynamoDB
  await docClient.put(params).promise();
  console.log(`New entry created:`, newEntry);
  
  // Redirect to the homepage or wherever you want
  res.redirect("/"); // Redirect or send a success message
} catch (error) {
  console.error('Error inserting entry:', error);
  res.status(500).send('Internal Server Error');
}
 
});



app.post("/edit", async (req, res) => {
  const item = req.body.updatedItemTitle;
  const id = req.body.updatedItemId;
  var date = new Date();
    var dd = String(date.getDate()).padStart(2, '0');
    var mm = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = date.getFullYear();
    date = dd + '/' + mm + '/' + yyyy;

  const params = {
    TableName: 'toDo', // Your DynamoDB table name
    Item: {
        id : id,
        title : item, // Update as needed
        dateCreated: date
    }
};

try {
    await docClient.put(params).promise();
    console.log(`Post updated:`, { id: id });

    res.redirect("/"); // Redirect after successful update
} catch (error) {
    console.error('Error updating post:', error);
    res.status(500).send("Internal Server Error");
}

});

app.post("/delete", async (req, res) => {
  const id = req.body.deleteItemId;
  const params = {
    TableName: 'toDo', // Your DynamoDB table name
    Key: {
        id: id // Using title as the primary key
    }
  }
  try {
    // Delete the item from DynamoDB
    await docClient.delete(params).promise();
    console.log(`Post deleted with id: ${id}`);
    
    // Redirect to the homepage or send a success message
    res.redirect("/"); // Redirect after deletion
} catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).send("Internal Server Error");
}
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
