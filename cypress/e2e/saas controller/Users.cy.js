import token from "../POM/token.js";
import normalusertoken from "../POM/normaltoken.js";
import Atoken from "../POM/Atoken.js";
import Ntoken from "../POM/Ntoken.js";
let beforeallUsers, isvalid, methoding, naming,user1;
const Adminbodydata = require('../../fixtures/Admchange.json'); 
const Normalbodydata = require('../../fixtures/Norchange.json');
const createbodydata = require('../../fixtures/createuser.json'); 
const bodydata = require('../../fixtures/newuser.json'); 
const updatebodydata = require('../../fixtures/updateuser.json');
const resetbodydata = require('../../fixtures/reset.json');  
const Ajv = require("ajv");
const avj = new Ajv();  

describe("USER PAGE VALIDATION", () => {
    before(()=>{
        token.set();
    })
    afterEach("clear console",() => {
        cy.wait(2000)
        console.log('\n','\n');
    });
    function generateRandomEmail() {
        const randomString = Math.random().toString(36).substring(2, 10);
        return `user_${randomString}@yahooo.com`;
    }
    function generateRandomUsername() {
        const randomString = Math.random().toString(36).substring(2, 10);
        return `user_${randomString}`;
    }
    function generateRandomFullName() {
        const randomString = Math.random().toString(36).substring(2, 10);
        return `User ${randomString}`;
    }
    function normalaccess() {   
        normalusertoken.set();        
    }
    function readUsersFromDB() {
        return cy.task("READFROMDB", {
            dbconfig: Cypress.config("DB"),
            sql: 'SELECT * FROM public.users ORDER BY id ASC'
        });
    }
    function tokenaccess(){
        Atoken.set();
        Ntoken.set();
        readUsersFromDB().then((result) => {
             beforeallUsers = result.rows;})
    }
    function schemavalidation(response){
        const schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "Generated schema for Root",
            "type": "object",
            "properties": {
                "id": { "type": "number" },
                "full_name": { "type": "string" },
                "username": { "type": "string" },
                "password": { "type": "string" },
                "user_type": { "type": "string" },
                "email": { "type": "string" }
            },
            "required": ["id", "full_name", "username", "password", "user_type", "email"],
            "additionalProperties": false
        };
        const validity = avj.compile(schema);
        isvalid = validity(response.body);
    }
    function validateresponse(response, inputData) {
        if (inputData.email && inputData.full_name && inputData.password && inputData.user_type && inputData.username) {
            if (response.status === 201) {
                cy.log(`Valid Data: ${JSON.stringify(inputData)}`);
                expect(response.status).to.be.equal(201);
                schemavalidation(response)
                expect(isvalid).to.be.true;
                const responseData = response.body;
                readUsersFromDB().then((result) => {
                    const allUsers = result.rows;
                    console.log(allUsers);
                    const user = allUsers.find(row => row.username === responseData.username);
                    if (user) {
                        if (user.email === responseData.email &&  user.full_name === responseData.full_name && user.user_type === inputData.user_type) {
                            
                            if (user.password && (typeof user.password === 'string') && (user.password.length > 0) && (user.password !== inputData.password)) {
                                console.log("**User details added successfully from database");
                            } else {
                                console.log("**User details did not match");
                            }
                        } else {
                            console.log("**User did not match");
                        }
                    } else {
                        console.log("**User not found in database");
                    }
                });
                expect(responseData.id).to.be.at.least(1); 
                expect(responseData.email).to.match(/\S+@\S+/); 
                const em = responseData.email;
                const espace = em.startsWith(' ') || em.endsWith(' ') || em.includes(' ');
                expect(espace).to.be.false; 
                expect(responseData.email).to.have.lengthOf.below(50);
                const un = responseData.username;
                const containsSpace = un.startsWith(' ') || un.endsWith(' ') || un.includes(' ');
                expect(containsSpace).to.be.false; 
                expect(responseData.username).to.have.lengthOf.below(20);
                const fnnm = responseData.full_name;                             
                const Space = !fnnm.startsWith(' ') && !fnnm.endsWith(' ' );
                expect(Space).to.be.true;                           
                expect(responseData.full_name).to.have.lengthOf.below(100);
                const pwd = inputData.password;
                expect(responseData.password).to.be.equal(""); 
                expect(inputData.password).to.have.lengthOf.below(100);
                const pwdspace = pwd.startsWith(' ') && pwd.endsWith(' ') && pwd.includes(' '); 
                expect(pwdspace).to.be.false;
                const allow = "*(&^%$#@!~?><_-`+=qwert1234567890yuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZX\\CVBNM;:/";  
                const pwdd = [...pwd].some(char => allow.includes(char));
                expect(pwdd).to.be.true;
                const usertype = responseData.user_type;
                const allowedut = ["admin", "normal"]; 
                expect(allowedut.includes(usertype)).to.be.true;
                const utspace = usertype.startsWith(' ') && usertype.endsWith(' ') && usertype.includes(' '); 
                expect(utspace).to.be.false;
                const notallw = "~!#$%^&*(())))-+={}|\][':;,_/?><@1234567890"; 
                const utchar = [...usertype].some(char => !notallw.includes(char));
                expect(utchar).to.be.true;
                expect(usertype).to.have.lengthOf.below(20);
                expect(response.headers['content-type']).to.include("application/json");
            }
            else if (response.status === 409) {
                expect(response.status).to.be.equal(409);
                cy.log(`already exist- Status: ${response.status}, Body: ${JSON.stringify(response.body)}, Input: ${JSON.stringify(inputData)}`);
                expect(response.body).to.be.oneOf(["Email already exists","Username already exists"]);
            }
            else if (response.status === 400) {                        
                const responseData = response.body;
                expect(response.status).to.equal(400);
                cy.log(`invalid- Status: ${response.status}, Body: ${JSON.stringify(response.body)}, Input: ${JSON.stringify(inputData)}`);

                if (responseData.email && (responseData.email.startsWith(' ') || responseData.email.endsWith(' ') || responseData.email.includes(' '))) {
                    expect(response.body).to.be.oneOf(["Invalid email address", "Fill all the required fields"]);
                } else if (responseData.username && (responseData.username.startsWith(' ') || responseData.username.endsWith(' ') || responseData.username.includes(' '))) {
                    expect(response.body).to.be.oneOf(["Username should not contain any space", "Fill all the required fields"]);
                } else if (inputData.password && (inputData.password.startsWith(' ') || inputData.password.endsWith(' ') || inputData.password.includes(' '))) {
                    expect(response.body).to.be.oneOf(["Password should not contain any space", "Fill all the required fields"]);
                } else if (responseData.user_type && (responseData.user_type.startsWith(' ') || responseData.user_type.endsWith(' ') || responseData.user_type.includes(' '))) {
                    expect(response.body).to.be.oneOf(["Invalid user type", "Fill all the required fields"]);
                } else if (responseData.full_name && (!responseData.full_name.startsWith(' ') && !responseData.full_name.endsWith(' '))) {
                    expect(response.body).to.be.oneOf(["Invalid payload", "Fill all the required fields"]);
                } else {
                    expect(response.body).to.be.oneOf(["Invalid user type","Password should not contain any space","Username should not contain any space","Invalid email address", "Fill all the required fields"]);
                }
            }
            else if (response.status === 401) {
                expect(response.status).to.equal(401);
                expect(response.body).to.equal("Admin authorization required");
                cy.log(`Unauthorized- Status: ${response.status}, Body: ${JSON.stringify(response.body)}, Input: ${JSON.stringify(inputData)}`);
            }
        }else if (response.status === 401) {
            expect(response.status).to.equal(401);
            expect(response.body).to.equal("Admin authorization required");
            cy.log(`Unauthorized- Status: ${response.status}, Body: ${JSON.stringify(response.body)}, Input: ${JSON.stringify(inputData)}`);
        }else {
            expect(response.status).to.equal(400);
            cy.log(`invalid- Status: ${response.status}, Body: ${JSON.stringify(response.body)}, Input: ${JSON.stringify(inputData)}`);
        }}
    
    function updateresponse(response, inputData) {
        if (inputData.email && inputData.id &&  inputData.user_type ) {
            if (response.status ===200) {
                cy.log(`Valid Data: ${JSON.stringify(inputData)}`);
                expect(response.status).to.be.equal(200)
                schemavalidation(response)
                expect(isvalid).to.be.true; 
                readUsersFromDB().then((result) => {
                    const allUsers = result.rows;
                    console.log(allUsers);
                    const user = allUsers.find(row => row.username === responseData.username);
                    if (user) {
                        if (user.email === responseData.email && user.full_name === responseData.full_name && user.user_type === responseData.user_type) {
                            console.log("**User details  updated successfully in database");
                        } else {
                            console.log("**User details did not match");
                        }
                    } else {
                        console.log("**User not found in database");
                    }
                });
                const responseData = response.body;
                expect(responseData.id).to.be.at.least(1); 
                expect(responseData.email).to.match(/\S+@\S+/); 
                const em=responseData.email;
                const espace = em.startsWith(' ') || em.endsWith(' ') || em.includes(' ');
                expect(espace).to.be.false; 
                expect(responseData.email).to.have.lengthOf.below(50);
                const un = responseData.username; 
                const containsSpace = un.startsWith(' ') || un.endsWith(' ') || un.includes(' ');
                expect(containsSpace).to.be.false;
                expect(responseData.username).to.have.lengthOf.at.least(1)
                expect(responseData.username).to.have.lengthOf.below(20);
                const fnnm = responseData.full_name;
                const Space = !fnnm.startsWith(' ') && !fnnm.endsWith(' ') ;
                expect(Space).to.be.true;  
                expect(responseData.password).to.be.equal(""); 
                const usertype=responseData.user_type
                const allowedut = ["admin", "normal",""]; 
                expect(allowedut.includes(usertype)).to.be.true;
                const utspace = usertype.startsWith(' ') && usertype.endsWith(' ') && usertype.includes(' '); 
                expect(utspace).to.be.false;
                expect(usertype).to.have.lengthOf.below(20);
            } else if (response.status===400) {
                expect(response.status).to.be.equal(400)
                if (!inputData.email.match(/\S+@\S+/)) {
                    expect(response.status).to.have.equal(400)
                    expect(response.body).to.be.equal("Invalid email address");
                } else if (inputData.user_type && (inputData.user_type.startsWith(' ') || inputData.user_type.endsWith(' ') || inputData.user_type.includes(' ') || inputData.user_type==="" || inputData.user_type!="admin" ||  inputData.user_type!="normal")) {
                    expect(response.status).to.have.equal(400)
                    expect(response.body).to.be.equal("Invalid user type");
                }  }
            else if(response.status===409) {
                    expect(response.status).to.have.equal(409)
                    expect(response.body).to.be.equal("Email already exists");
            }else if (response.status===404){
                    expect(response.status).to.have.equal(404)
                    expect(response.body).to.be.equal("User not found");
                }
            else if(response.status===401) {
                expect(response.status).to.be.equal(401)
                expect(response.body).to.be.equal("Admin authorization required")
            }else{
                expect(response.status).to.be.equal(500)
                expect(response.body).to.be.equal("Admin authorization required")
            }
        }}

    function changeresponse(response, inputData,naming) {
        if (inputData.new_password && inputData.old_password) {
            if (response.status===200) {
                cy.log(`Valid Data: ${JSON.stringify(inputData)}`);
                expect(response.status).to.be.equal(200);
                expect(response.body).to.be.equal("Password updated successfully")
                readUsersFromDB().then((result) => {
                const afterallUsers = result.rows;
                if(naming==="somu" || naming ==="ramu"){
                 user1 = afterallUsers.find(row => row.username === naming);
                const user2=beforeallUsers.find(row => row.username === naming);
                    if(user1.password !== user2.password){
                        console.log("**password changed in database successfully")
                    }
                    else{console.log("**user not exist")}
               }else {console.log("**user not existed in database")}
            });

        } else if (inputData.old_password.includes(" ")  ) {
            expect(response.status).to.be.equal(400)
            expect(response.body).to.be.equal("Invalid credentials")
            cy.log(`invalid payload - Status: ${response.status}, Body: ${JSON.stringify(response.body)}, Input: ${JSON.stringify(inputData)}`);
        } else if (inputData.new_password.includes(" ")  ) {
            expect(response.status).to.be.equal(400)
            expect(response.body).to.be.equal("password should not contain any space")
            cy.log(`invalid payload - Status: ${response.status}, Body: ${JSON.stringify(response.body)}, Input: ${JSON.stringify(inputData)}`);
        } else if (response.status === 400) {
            expect(response.status).to.be.equal(400)
            expect(response.body).to.be.oneOf(["Invalid credentials","Fill all the required fields"])
            cy.log(`invalid payload - Status: ${response.status}, Body: ${JSON.stringify(response.body)}, Input: ${JSON.stringify(inputData)}`);
            }
    }else if (!inputData.new_password || !inputData.old_password) 
        { expect(response.status).to.be.equal(400)
            expect(response.body).to.be.oneOf(["Invalid credentials","Fill all the required fields"])
            cy.log(`invalid payload - Status: ${response.status}, Body: ${JSON.stringify(response.body)}, Input: ${JSON.stringify(inputData)}`);
    }else{
     expect(response.status).to.be.equal(401)}
}

function resetresponse(response,inputData,naming){
    if (response.status===200) {
        cy.log(`Valid Data: ${JSON.stringify(inputData)}`);
        expect(response.status).to.be.equal(200);
        readUsersFromDB().then((result) => {
            const afterallUsers = result.rows;
            console.log(inputData.username)
            if(inputData.username==="sree" || inputData.username==="sri"){
            user1 =afterallUsers.find(row => row.username === inputData.username);
            const user2=beforeallUsers.find(row => row.username === inputData.username);
            console.log(user1,user2)
                if(user1.password !== user2.password){
                    console.log("**password reseted in database successfully")
                }
                else{console.log("**password not updated ")}
           }else{console.log("**user not existed in database")}
        })
        expect(response.body).to.be.equal("Password reset successful! Check your email for the new password")
    } else if (inputData.username.includes(" ") || inputData.username==="") {
        expect(response.status).to.be.equal(400)
        expect(response.body).to.be.equal("Fill the required field")
        cy.log(`invalid payload - Status: ${response.status}, Body: ${JSON.stringify(response.body)}, Input: ${JSON.stringify(inputData)}`);
    } else if(response.status===500){
        expect(response.status).to.be.equal(500)
        expect(response.body).to.be.equal("Failed to send email")
        readUsersFromDB().then((result) => {
            const afterallUsers = result.rows;
            user1 =afterallUsers.find(row => row.username === inputData.username);
            if(user1.email !=="varshiniuu@gmail.com" && user1.email!=="varshini1626.uv@gmail"){
                console.log("***recheck email -from databe")
            cy.log(`unauthorized - Status: ${response.status}, Body: ${JSON.stringify(response.body)}, Input: ${JSON.stringify(inputData)}`);
        }})}
}
function getresponse(response) {
    if(response.status===200){
                expect(response.status).to.be.equal(200)
                schemavalidation(response)
                expect(isvalid).to.be.true; 
                const responseData=response.body
                expect(responseData.id).to.be.at.least(1); 
                expect(responseData.email).to.match(/\S+@\S+/); 
                const em=responseData.email;
                const espace = em.startsWith(' ') || em.endsWith(' ') || em.includes(' ');
                expect(espace).to.be.false; 
                expect(responseData.email).to.have.lengthOf.below(50);
                const un = responseData.username;
                const containsSpace = un.startsWith(' ') || un.endsWith(' ') || un.includes(' ');
                expect(containsSpace).to.be.false;
                expect(responseData.username).to.have.lengthOf.below(20);
                const fnnm = responseData.full_name; 
                const Space = !fnnm.startsWith(' ') && !fnnm.endsWith(' ') ;
                expect(Space).to.be.true;                           
                expect(responseData.full_name).to.have.lengthOf.below(100);
                expect(responseData.password).to.be.equal(""); 
                const usertype=responseData.user_type
                const allowedut = ["admin", "normal"]; 
                expect(allowedut.includes(usertype)).to.be.true;
                const utspace = usertype.startsWith(' ') && usertype.endsWith(' ') && usertype.includes(' '); 
                expect(utspace).to.be.false;
                const notallw = "~!#$%^&*(())))-+={}|\][':;,_/?><@1234567890"; 
                const utchar = [...usertype].some(char => !notallw.includes(char));
                expect(utchar).to.be.true;
                expect(usertype).to.have.lengthOf.below(20);        
            }else if (response.status === 404) {
                throw new Error(`User not found - Status: ${response.status}, Body: ${JSON.stringify(response.body)}`);
            } else if (response.status === 500) {
                throw new Error(`Internal server down - Status: ${response.status}, Body: ${JSON.stringify(response.body)}`);
            }
        }
    const getallresponse = (response, tokens) => {           
        if(response.status===200){
            const schema = {
                "$schema": "http://json-schema.org/draft-07/schema#",
                "title": "User Schema",
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "number"},
                        "full_name": {"type": "string"},
                        "username": {"type": "string"},
                        "password": {"type": "string"},
                        "user_type": {"type": "string"},
                        "email": {"type": "string", "format": "email"}
                    },
                    "required": ["id", "full_name", "username", "password", "user_type", "email"],
                    "additionalProperties": false
                }
            };
            const validity = avj.compile(schema);
            const isvalid = validity(response.body);
            expect(isvalid, "Schema validated successfully").to.be.true;
            const encounteredIds = {};
            const encounteredUsernames = new Set();
            const encounteredEmails = new Set();
            response.body.forEach(user => {
                //id
                expect(user.id).to.be.at.least(1);
                expect(encounteredIds[user.id]).to.be.undefined;
                encounteredIds[user.id] = true;
                //fullname
                const fnnm = user.full_name;
                const Space = !fnnm.startsWith(' ') && !fnnm.endsWith(' ');
                expect(Space).to.be.true;
                expect(user.full_name).to.have.lengthOf.below(100);
                //password
                expect(user.password).to.equal("");
                //username
                expect(user.username).to.have.lengthOf.at.least(1);
                expect(encounteredUsernames.has(user.username)).to.be.false;
                encounteredUsernames.add(user.username);
                const containsSpace = user.username.startsWith(' ') || user.username.endsWith(' ') || user.username.includes(' ');
                expect(containsSpace).to.be.false; 
                expect(user.username).to.have.lengthOf.below(20);
                //email
                expect(user.email).to.have.lengthOf.at.least(1);
                expect(user.email).to.match(/\S+@\S+/);
                expect(encounteredEmails.has(user.email)).to.be.false;
                encounteredEmails.add(user.email);
                const em = user.email;
                const espace = em.startsWith(' ') || em.endsWith(' ') || em.includes(' ');
                expect(espace).to.be.false; 
                expect(user.email).to.have.lengthOf.below(50);
                //usertype
                if(tokens===Cypress.env("normalusertoken")){
                    expect(user.user_type).to.be.a('string').and.to.be.equal("normal");
                    
                }else{
                    expect(user.user_type).to.be.a('string').and.to.be.oneOf(["admin","normal",""]);
                }
                const usertype = user.user_type
                const utspace = usertype.startsWith(' ') && usertype.endsWith(' ') && usertype.includes(' '); 
                expect(utspace).to.be.false;
                const notallw = "~!#$%^&*(())))-+={}|\][':;,_/?><@1234567890"; 
                const utchar = [...usertype].some(char => !notallw.includes(char));
                expect(utchar).to.be.true;
                expect(usertype).to.have.lengthOf.below(20);
            });
        }
        else if (response.status === 404) {
            throw new Error(`User not found - Status: ${response.status}, Body: ${JSON.stringify(response.body)}`);
        } else if (response.status === 500) {
            throw new Error(`Internal server down - Status: ${response.status}, Body: ${JSON.stringify(response.body)}`);
        }
    }
function deleteresponse(response) {
        if (response.status === 200) {
            expect(response.status).to.be.equal(200);
            expect(response.body).to.have.lengthOf.at.least(1);
            expect(response.body).to.be.equal("User deleted successfully");
            readUsersFromDB().then((result) => {
                const allUsers = result.rows;
                let userFound = false;
                allUsers.forEach(user => {
                    if (parseInt(user.id) === 10) {
                        userFound = true;
                    } });
                if (userFound) {
                    console.log("***User not deleted"); 
                } else {
                    console.log("***User deleted successfully in database"); }
            });
        } else if(response.status===401){
                    expect(response.status).to.be.equal(401)
                    expect(response.body).to.equal("Admin authorization required");
                    cy.log(`Unauthorized - Status: ${response.status}, Body: ${JSON.stringify(response.body)}`);
        }
            else if (response.status===404) {
                    expect(response.status).to.be.equal(404)
                    expect(response.body).to.be.equal("User not found")
                    readUsersFromDB().then((result) => {
                        const allUsers = result.rows;
                        let userFound = false;
                        allUsers.forEach(user => {
                            if (parseInt(user.id) === 10) {
                                userFound = true;
                            } });
                        if (userFound) {
                            console.log("***User found in database"); 
                        } else {
                            console.log("***User id not found in database"); }
                    });
                    cy.log(`ID not found - Status: ${response.status}, Body: ${JSON.stringify(response.body)}`);
             }
        }
    const makerequest = (methods, tokens, urls, inputData) => {
        cy.request({
            method: methods,
            url: urls,
            headers: {
                "token": tokens
            },
            body: inputData,
            failOnStatusCode: false
        }).then((response) => {
           cy.fixture("url.json").then((data) => { 
            console.log(response.body);
            if (urls === data.createuser && methoding==="POST") {
                validateresponse(response, inputData);
            }  
            else if (urls === data.updateuser && methoding==="PUT") {
                updateresponse(response, inputData);
            }
            else if(urls === data.changepwd && methoding==="PUT"){
                changeresponse(response,inputData,naming)
            }
            else if(urls === data.resetpwd && methoding==="PUT"){
                resetresponse(response,inputData,naming)
            }
            else if(urls === data.getuser && methoding==="GET"){
                getresponse(response)
            }
            else if(urls === data.getalluser && methoding==="GET"){
                getallresponse(response,tokens)
            }else if(urls === data.deleteuser && methoding==="DELETE"){
                deleteresponse(response)
            }
        })
        });
    };
    it(``, () => {
        createbodydata.forEach((inputData) => {
            cy.fixture("url.json").then((data) => { 
                cy.request({
                    method: "Post",
                    url: data.createuser,
                    headers: {
                        "token": Cypress.env("token")
                    },
                    body: inputData,
                    failOnStatusCode: false
                }).then((response) => {
                    expect(response.status).to.be.oneOf([201,409])
                    normalaccess()
                })
        });
    });})
    it(`Create by Admin`, () => {
        bodydata.forEach((inputData) => {
            if (inputData.generateRandomEmail) {
                inputData.email = generateRandomEmail();
            }
            if (inputData.generateRandomUsername) {
                inputData.username = generateRandomUsername();
            }
            if (inputData.generateRandomFullName) {
                inputData.full_name = generateRandomFullName();
            }
            cy.fixture("url.json").then((data) => { 
                methoding="POST";
                makerequest("POST", Cypress.env("token"), data.createuser, inputData);
            });
        });
    });
             
    it("Create by Normal user", () => {
        cy.fixture("url.json").then((data) => { 
            const inputData = bodydata[0];
            methoding="POST";
            makerequest("POST", Cypress.env("normalusertoken"), data.createuser, inputData);
        });
    });
    it("Update user by Admin", () => {
        updatebodydata.forEach((inputData) => {
            if (inputData.generateRandomEmail) {
                inputData.email = generateRandomEmail();
            }
            cy.fixture("url.json").then((data) => { 
                methoding="PUT";
                makerequest("PUT", Cypress.env("token"), data.updateuser, inputData);
            });
        });
    });
    it("Update by Normal user", () => {
        cy.fixture("url.json").then((data) => { 
            const inputData = updatebodydata[0];
            makerequest("PUT", Cypress.env("normalusertoken"), data.updateuser, inputData);
        });
    });
    it("Changepassword by Admin",()=>{
        tokenaccess();
        Adminbodydata.forEach((inputData) => {
            cy.fixture("url.json").then((data) => { 
                methoding="PUT";
                naming=Cypress.env("somu")
                makerequest("PUT",Cypress.env("Atoken"),data.changepwd,inputData)
            })
        })
    })
    it("Changepassword by Normal",()=>{
        tokenaccess();
        Normalbodydata.forEach((inputData) => {
                cy.fixture("url.json").then((data) => { 
                    methoding="PUT";
                    naming=Cypress.env("ramu")
                makerequest("PUT",Cypress.env("Ntoken"),data.changepwd,inputData)
            })
        })
    })
    it(`Reset Password by Admin`, () => {
        resetbodydata.forEach((inputData) => {
        cy.fixture("url.json").then((data) => { 
            methoding="PUT"
            naming= Cypress.env("sree")
            makerequest("PUT",Cypress.env("token"),data.resetpwd,inputData)         
        })
    })
    });
    it(`Reset Password by Normal user`, () => {
            resetbodydata.forEach((inputData) => {
            cy.fixture("url.json").then((data) => { 
                methoding="PUT"
                naming= Cypress.env("sri")
                makerequest("PUT",Cypress.env("normalusertoken"),data.resetpwd,inputData)         
            })
        })
    });
    it(`Get by Admin`, () => {
        cy.fixture("url.json").then((data) => { 
        methoding="GET"
        makerequest("GET",Cypress.env("token"),data.getuser,null);
    })});
    it("Get by Normal user", () => {
        cy.fixture("url.json").then((data) => { 
        methoding="GET";
        makerequest("GET",Cypress.env("normalusertoken"),data.getuser,null);
    }) });
    it(`Get all Users by Admin`, () => {
        cy.fixture("url.json").then((data) => { 
            methoding="GET"
         makerequest("GET",Cypress.env("token"),data.getalluser,null);
    }) });   
    it("Get all Users by Normal user", () => {
        cy.fixture("url.json").then((data) => { 
            methoding="GET"
            makerequest("GET",Cypress.env("normalusertoken"),data.getalluser,null);
    }) });
    it(`Delete by Admin`, () => {
        cy.fixture("url.json").then((data) => { 
            methoding="DELETE";
            makerequest("DELETE",Cypress.env("token"),data.deleteuser,null);
        })
     });
    it("Delete by Normal user", () => {
        cy.fixture("url.json").then((data) => { 
            methoding="DELETE";
            makerequest("DELETE",Cypress.env("normalusertoken"),data.deleteuser,null);
    }) });
});
