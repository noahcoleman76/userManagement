const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const uuid = require('uuid');

const express = require('express');
let app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

const ReadAndWrite = require("read-and-write").ReadAndWrite;
const fileReader = new ReadAndWrite("users.txt");
let users = fileReader.readAllRecordsSync();

let header = [
    {
        id: 'name',
        title: 'Name',
        value: ''
    },
    {
        id: 'email',
        title: 'Email',
        value: ''
    },
    {
        id: 'age',
        title: 'Age',
        value: ''
    }
];

let userBeingEditedID;

app.get('/', (req, res) => {
    res.render('mainPage');
});

app.get('/createUser', (req, res) => {
    console.log(header);
    res.render('newUser', {inputs: header});
});

app.post('/newUser', (req, res) => {
    console.log('new user creation', req.body);
    if (req.body.name === undefined) {
        res.redirect('/createUser');
    }
    let newUser = {...req.body};
    newUser.id = uuid.v4();
    users.push(newUser);
    fileReader.appendRecordsSync([newUser]);
    res.redirect('/userListing');
});
app.get('/userListing', (req, res) => {
    if (users.length === 0) {
        res.redirect('/createUser');
    }
    console.log('user listing users', users);
    res.render('userListing', {inputs: header, users: users});
});

app.get('/edit/:id', (req, res) => {
    userBeingEditedID = req.params.id;
    let editHeader = JSON.parse(JSON.stringify(header));
    let user = users.find(u => u.id === req.params.id);
    if (user !== undefined){
        for (let i = 0; i < editHeader.length; i++){
            console.log('value before ', editHeader[i].value);
            editHeader[i].value = user[editHeader[i].id];
            console.log('value after ', editHeader[i].value);
        }
        console.log(editHeader);
        res.render('userEdit', {user: user, inputs: editHeader});
    }
    else{
        res.redirect('/userListing');
    }
});

app.get('/remove/:id', (req, res) => {
    console.log('all users before remove', users);
    console.log('id from url', req.params.id);
    users.splice(users.findIndex(u => u.id === req.params.id), 1);
    fileReader.deleteRecordSync({key: 'id', value: req.params.id});
    res.redirect('/userListing');
});
app.post('/updateUser', (req, res) => {
    if (users.findIndex(u => u.id === userBeingEditedID) !== -1) {
        let updatedUser = {...req.body};
        updatedUser.id = userBeingEditedID;
        users[users.findIndex(u => u.id === userBeingEditedID)] = updatedUser;
        let keyValuePairs = [];
        for (let [key, value] of Object.entries({...req.body})) {
            keyValuePairs.push({
                key: key,
                value: value
            });
        }
        keyValuePairs.push({
            key: 'id',
            value: userBeingEditedID
        });
        console.log(keyValuePairs);
        fileReader.editRecordSync({key: 'id', value: userBeingEditedID}, keyValuePairs);
    }
    res.redirect('/userListing');
});


app.listen(3050, () => {
    console.log('The server is up and listening on port 3050');
});


