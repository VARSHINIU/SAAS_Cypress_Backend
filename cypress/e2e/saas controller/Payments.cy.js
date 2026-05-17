import token from "../POM/token.js";
import normalusertoken from "../POM/normaltoken.js";
const bodydata = require('../../fixtures/newpayment.json');
const updatebodydata = require('../../fixtures/updatepayment.json'); 
const Ajv = require("ajv");
const avj = new Ajv();
let  isvalid, methoding;

describe("PAYMENT PAGE VALIDATION", () => { 
    before("Accessing token", () => {   
        normalusertoken.set();
        token.set();
        console.clear();
    });
    afterEach("clear console", () => {
        cy.wait(2000);
        console.log('\n','\n');
    });
    function readUsersFromDB() {
        return cy.task("READFROMDB", {
            dbconfig: Cypress.config("DB"),
            sql: 'SELECT * FROM public.payment_milestones ORDER BY customer_id ASC, subscription_id ASC, milestone_id '
        });
    }
    function schemavalidation(response){
        const schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "Generated schema for Root",
            "type": "object",
            "properties": {
                "customer_id": { "type": "number" },
                "subscription_id": { "type": "number" },
                "milestone_id": { "type": "number" },
                "description": { "type": "string" },
                "due_date": { "type": "string" },
                "payment_status": { "type": "string" }
            },
            "required": ["customer_id","subscription_id","milestone_id","description","due_date","payment_status"],
            "additionalProperties": false
        };
        const validity = avj.compile(schema);
        isvalid = validity(response.body);
    }
    function schemavalidationid(response){
        const schema =  {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "Generated schema for Root",
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "customer_id": {"type": "number"},
                "subscription_id": {"type": "number"},
                "milestone_id": {"type": "number"},
                "description": {"type": "string"},
                "due_date": {"type": "string"},
                "payment_status": {"type": "string"}
              },
              "required": ["customer_id","subscription_id","milestone_id","description","due_date","payment_status"],
              "additionalProperties": false
            }
          } 
        const validity = avj.compile(schema);
        isvalid = validity(response.body);
    }
    function validationpayment(response){
        expect(response.body.customer_id).to.not.be.null;
        expect(response.body.customer_id).to.be.at.least(1);
        expect(response.body.subscription_id).to.not.be.null;
        expect(response.body.subscription_id).to.be.at.least(1);
        expect(response.body.milestone_id).to.not.be.null;
        expect(response.body.milestone_id).to.be.at.least(1);
        expect(response.body).to.be.an('object');
        if (response.body.description !== null && typeof response.body.description === 'string') {
            expect(response.body.description).to.have.lengthOf.below(100);
        } else {
            expect(response.body.description).to.equal(null);
        }
        if(response.status===200){
            expect(response.body.due_date).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+\d{2}:\d{2}$/);
        } else {
            expect(response.body.due_date).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
        }   
        expect(response.body.payment_status).to.be.oneOf(['paid', 'unpaid']);
        expect(response.body.payment_status).to.have.lengthOf.below(11);   
    }
    function createresponse(response,inputData){
        if(inputData.customer_id  && inputData.subscription_id &&  inputData.payment_status   && inputData.due_date){
            if (response.status === 201) {
                cy.log(`Valid Data: ${JSON.stringify(inputData)}`);
                expect(response.status).to.equal(201);
                schemavalidation(response);
                expect(isvalid).to.be.true;
                const responseData=response.body;
                readUsersFromDB().then((result) => {
                    const allsubs = result.rows;
                    const user = allsubs.find(row => (parseInt(row.customer_id) === responseData.customer_id)   && (parseInt(row.subscription_id) === responseData.subscription_id ) && (parseInt(row.milestone_id) === responseData.milestone_id));
                    if (user) {
                        if (user.description === responseData.description   && (inputData.due_date) === (responseData.due_date) && (inputData.payment_status) === (responseData.payment_status)) {
                            console.log("**payment details added successfully in database");
                        } else {
                            console.log("**ID did not match");
                        }
                    } else {
                        console.log("**ID not found in database");
                    }
                });
                validationpayment(response);
            } else if(response.status === 400) {
                expect(response.status).to.be.equal(400);
                expect(response.body).to.be.oneOf(['parsing time "2023-0:00Z" as "2006-01-02T15:04:05Z07:00": cannot parse "0:00Z" as "01"','Fill all the required fields','Enter Valid Status']);
                cy.log(`invalid payload- Status: ${response.status}, Body: ${JSON.stringify(response.body)}, Input: ${JSON.stringify(inputData)}`);
            } else if(response.status===404){
                expect(response.status).to.be.equal(404);
                expect(response.body).to.be.equal("Record not found check custmer ID and subscription ID");
            } else if(response.status === 401) {
                expect(response.status).to.be.equal(401);
                expect(response.body).to.be.equal('Admin authorization required');
                cy.log(`unauthorized- Status: ${response.status}, Body: ${JSON.stringify(response.body)}`);
            }
        } else if(response.status === 400) {
            expect(response.status).to.be.equal(400);
            expect(response.body).to.be.equal("Fill all the required fields");
        }
    }

    function updateresponse(response,inputData){
        if(inputData.customer_id  && inputData.subscription_id &&  inputData.payment_status ){
            if (response.status === 200) {
                cy.log(`Valid Data: ${JSON.stringify(inputData)}`);
                expect(response.status).to.equal(200);
                schemavalidation(response);
                expect(isvalid).to.be.true;
                const responseData=response.body
                readUsersFromDB().then((result) => {
                    const allsubs = result.rows;
                    const user = allsubs.find(row => (parseInt(row.customer_id) === responseData.customer_id)   && (parseInt(row.subscription_id) === responseData.subscription_id ) && (parseInt(row.milestone_id) === responseData.milestone_id) );
                    if (user) {
                        if (user.description === responseData.description   || (inputData.due_date) === (responseData.due_date) || (inputData.payment_status) === (responseData.payment_status)) {
                            console.log("**payment details updated successfully in database");
                        } else {
                            console.log("**ID did not match");
                        }
                    } else {
                        console.log("**ID not found in database");
                    }
                });
                validationpayment(response);
            } else if(response.status === 400) {
                expect(response.status).to.be.equal(400);
                expect(response.body).to.be.oneOf(['parsing time "2023-05-0" as "2006-01-02T15:04:05Z07:00": cannot parse "0" as "02"','Fill all the required fields','Enter Valid Status','parsing time "2023-0:00Z" as "2006-01-02T15:04:05Z07:00": cannot parse "0:00Z" as "01"']);
                cy.log(`invalid payload- Status: ${response.status}, Body: ${JSON.stringify(response.body)}, Input: ${JSON.stringify(inputData)}`);
            } else if(response.status===404){
                expect(response.status).to.be.equal(404);
                expect(response.body).to.be.equal("Record not found");
            } else if(response.status === 401) {
                expect(response.status).to.be.equal(401);
                expect(response.body).to.be.equal('Admin authorization required');
                cy.log(`unauthorized- Status: ${response.status}, Body: ${JSON.stringify(response.body)}`);
            }
        } else if(response.status === 400) {
            expect(response.status).to.be.equal(400);
            expect(response.body).to.be.equal("Fill all the required fields");
        }
    }
    function getvalidation(response){
        schemavalidationid(response)
        expect(isvalid).to.be.true;
        const responseData=response.body;
            responseData.forEach((item, index) => {
                expect(item.customer_id).to.not.be.null;
                expect(item.customer_id).to.be.at.least(1);
                expect(item.subscription_id).to.not.be.null;
                expect(item.subscription_id).to.be.at.least(1);
                expect(item.milestone_id).to.not.be.null;
                expect(item.milestone_id).to.be.at.least(1);
                if (item.description !== null && typeof item.description === 'string') {
                    expect(item.description).to.have.lengthOf.below(100);
                } else {
                    expect(item.description).to.equal(null);
                }
                expect(item.due_date).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+\d{2}:\d{2}$/);
                expect(item.payment_status).to.be.oneOf(['paid', 'unpaid','']);
                expect(item.payment_status).to.have.lengthOf.below(11);
                });
    }
    function getbycusidresponse(response){
        if(response.status===200){
            expect(response.status).to.be.equal(200)
            getvalidation(response)
            let firstCustomerId;
            const responseData=response.body;
            responseData.forEach((item, index) => {
                const customerId = item.customer_id;
                if (index === 0) {
                    firstCustomerId = customerId;
                } else {
                    expect(customerId).to.equal(firstCustomerId, 'All customer IDs should be the same');
                }})
    }else if(response.status===404){
        expect(response.status).to.be.equal(404)
    }
}
    function getbycussubidresponse(response){
            if(response.status===200){
                expect(response.status).to.be.equal(200)
                getvalidation(response)
                const responseData=response.body;
                let firstsubscription_id
                responseData.forEach((item, index) => {
                    const subscriptionId = item.subscription_id;
                if (index === 0) {
                    firstsubscription_id = subscriptionId;
                } else {
                    expect(subscriptionId).to.equal(firstsubscription_id, 'All subscription IDs should be the same');
                }
                })
        }else if(response.status===404){
            expect(response.status).to.be.equal(404)
        }
    }
    function getallresponse(response){
        if(response.status===200){
            getvalidation(response)
        }    else if(response.status===404){
            expect(response.status).to.be.equal(404)
        }    
    }
    function deleteresponse(response){
        if(response.status===200){
            expect(response.status).to.be.equal(200)
            expect(response.body).to.have.lengthOf.at.least(1);
            expect(response.body).to.be.equal("Payment record deleted successfully");
            readUsersFromDB().then((result) => {
                const allsubs = result.rows;
                    const user = allsubs.find(row => (parseInt(row.customer_id) === 2)   && (parseInt(row.subscription_id) === 2 ) && (parseInt(row.milestone_id) === 4) );
                    if (user) {
                            console.log("**payment not not deleted successfully");
                        }
                     else {
                        console.log("**payment deleted successfully");
                    }
                });
        } else if(response.status===401){
                    expect(response.status).to.be.equal(401)
                    expect(response.body).to.equal("Admin authorization required");
                    cy.log(`Unauthorized - Status: ${response.status}, Body: ${JSON.stringify(response.body)}`);
        }
            else if (response.status===404) {
                    expect(response.status).to.be.equal(404)
                    expect(response.body).to.be.equal("Record not Found")
                    cy.task("READFROMDB", {
                        dbconfig: Cypress.config("DB"),
                        sql: 'SELECT * FROM public.payment_milestones ORDER BY customer_id ASC, subscription_id ASC, milestone_id ASC'
                    }).then((result) => {
                        const allsubs = result.rows;
                            const user = allsubs.find(row => (parseInt(row.customer_id) === 2)   && (parseInt(row.subscription_id) === 2 ) && (parseInt(row.milestone_id) === 4) );
                            if (user) {
                                    console.log("**payment is presented");
                                }
                             else {
                                console.log("**payment id not found in database");
                            }
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
                if (urls === data.createpayment && methoding==="POST") {
                    createresponse(response, inputData);
                } else if(urls === data.updatepayment && methoding==="PUT"){
                    updateresponse(response,inputData);
                } else if(urls === data.getpaymentCID && methoding==="GET"){
                    getbycusidresponse(response);
                }  else if(urls === data.getpaymentCIDSID && methoding==="GET"){
                    getbycussubidresponse(response);
                }else if(urls === data.getallpayment && methoding==="GET"){
                    getallresponse(response);
                }else if(urls === data.deletepayment && methoding==="DELETE"){
                    deleteresponse(response);
                }
            });
        });
    };
    
    it("Create by Admin", () => {
        bodydata.forEach((inputData) => {
            cy.fixture("url.json").then((data) => { 
                methoding="POST";
                makerequest("POST",  Cypress.env("token"), data.createpayment, inputData);
            });
        });
    });

    it("Create by Normal", () => {
        const inputData = bodydata[0];
        cy.fixture("url.json").then((data) => { 
            methoding="POST";
            makerequest("POST",Cypress.env("normalusertoken"), data.createpayment, inputData);
        });
    });

    it("Update by admin", () => {
        updatebodydata.forEach((inputData) => {
            cy.fixture("url.json").then((data) => { 
                methoding="PUT";
                makerequest("PUT",  Cypress.env("token"),data.updatepayment, inputData);
            });
        });
    });

    it("Update by Normal", () => {
        cy.fixture("url.json").then((data) => { 
            const inputData = updatebodydata[0];
            methoding="PUT";
            makerequest("PUT",  Cypress.env("normalusertoken"),data.updatepayment, inputData);
        });
    });
    it("Get by Cus_id (admin)", () => {
            cy.fixture("url.json").then((data) => { 
                methoding="GET";
                makerequest("GET", Cypress.env("token"),data.getpaymentCID, null);
            });
        });
    it("Get by Cus_id (normal)", () => {
            cy.fixture("url.json").then((data) => { 
                methoding="GET";
                makerequest("GET", Cypress.env("normalusertoken"),data.getpaymentCID, null);
            });
        });
    it("Get by Cus_Sub_id (admin)", () => {
            cy.fixture("url.json").then((data) => { 
                methoding="GET";
                makerequest("GET", Cypress.env("token"),data.getpaymentCIDSID, null);
            });
        });
    it("Get by Cus_Sub_id (Normal)", () => {
            cy.fixture("url.json").then((data) => { 
                methoding="GET";
                makerequest("GET", Cypress.env("normalusertoken"),data.getpaymentCIDSID, null);
            });
        });
    it("get all  by admin", () => {
            cy.fixture("url.json").then((data) => { 
                methoding="GET";
                makerequest("GET", Cypress.env("token"),data.getallpayment, null);
            });
        });
    it("get all  by normal", () => {
            cy.fixture("url.json").then((data) => { 
                methoding="GET";
                makerequest("GET", Cypress.env("normalusertoken"),data.getallpayment, null);
            });
        });
    it("delete by admin", () => {
            cy.fixture("url.json").then((data) => { 
                methoding="DELETE";
                makerequest("DELETE", Cypress.env("token"),data.deletepayment, null);
            });
        });
    it("delete by normal", () => {
            cy.fixture("url.json").then((data) => { 
                methoding="DELETE";
                makerequest("DELETE", Cypress.env("normalusertoken"),data.deletepayment, null);
            });
        });
});

