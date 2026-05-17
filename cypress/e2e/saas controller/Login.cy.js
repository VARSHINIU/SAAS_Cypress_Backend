describe("LOGIN API (AUTHENTICATION)", () => {
    const bodyData = require('../../fixtures/login.json');
    const Ajv = require("ajv");
    const ajv = new Ajv();
    
    console.clear(); 
    function readUsersFromDB() {
        return cy.task("READFROMDB", {
            dbconfig: Cypress.config("DB"),
            sql: 'SELECT * FROM public.users ORDER BY id ASC'
        });
    }
    bodyData.forEach((inputData, index) => {
        it(`Login validation - Test Case ${index + 1}`, () => {
            cy.fixture('url.json').then((data) => {
                cy.request({
                    method: "POST",
                    url: data.login,
                    body: inputData,
                    failOnStatusCode: false 
                }).then((response) => {
                    if (inputData.password && inputData.username) {
                        if (inputData.password === "1234" && inputData.username === "admin") {
                            cy.log(`Valid credentials: ${JSON.stringify(inputData)}`);
                            console.log(response.body);
                            expect(response.status).to.equal(200);
    
                            const schema = {
                                "$schema": "http://json-schema.org/draft-07/schema#",
                                "title": "Generated schema for Root",
                                "type": "object",
                                "properties": {
                                    "id": {"type": "number"},
                                    "token": {"type": "string"},
                                    "full_name": {"type": "string"},
                                    "username": {"type": "string"},
                                    "user_type": {"type": "string"},
                                    "email": {"type": "string"}
                                },
                                "required": ["id", "token", "full_name", "username", "user_type", "email"],
                                "additionalProperties": false
                            };
                            
                            const validate = ajv.compile(schema);
                            const isValid = validate(response.body);
                            expect(isValid).to.be.true;
                            readUsersFromDB().then((result) => {
                                const allUsers = result.rows;
                                const user = allUsers.find(row => row.username === response.body.username);
                                if (user) {
                                    console.log("***verified user existed in Database")}
                                else{console.log("***user not found")}
                            })
                            expect(response.body.id).to.be.at.least(1);
                            expect(response.body.token).to.have.lengthOf.at.least(1);
                            expect(response.body.email).to.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
                            expect(response.body.email).to.have.lengthOf.at.least(7);
                            expect(response.body.full_name).to.have.lengthOf.at.least(1);
                            expect(response.body.username).to.have.lengthOf.at.least(1);
                            expect(response.body.user_type).to.be.oneOf(["admin", "normal"]);
                            expect(response.headers['content-type']).to.include("application/json");
                        } else {
                            expect(response.status).to.equal(401);
                            cy.log(`Invalid credentials - Status: ${response.status}, Body: ${JSON.stringify(response.body)}, Input: ${JSON.stringify(inputData)}`);
                            console.log(response.body);
                            expect(response.body).to.equal("Invalid credentials");
                        }
                    } else {
                        expect(response.status).to.equal(400);
                        cy.log(`Invalid payload - Status: ${response.status}, Body: ${JSON.stringify(response.body)}, Input: ${JSON.stringify(inputData)}`);
                        console.log(response.body);
                        expect(response.body).to.equal("Fill all the required fields");
                    }
                });
            });
        });
    });
});
