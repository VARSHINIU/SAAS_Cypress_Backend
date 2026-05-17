import token from "../POM/token.js"
import normalusertoken from "../POM/normaltoken.js";
let  isvalid, methoding;
const bodydata = require('../../fixtures/newcustomer.json'); 
const updatebodydata = require('../../fixtures/updatecustomer.json'); 
const Ajv = require("ajv")
const avj=new Ajv()

describe("CUSTOMER PAGE VALIDATION ", () => {
    before("Accessing token",() => {   
        normalusertoken.set()
        token.set();
        console.clear()
    });
    afterEach("clear console",() => {
        cy.wait(2000)
        console.log('\n','\n');
    });
    
    function readUsersFromDB() {
        return cy.task("READFROMDB", {
            dbconfig: Cypress.config("DB"),
            sql: 'SELECT * FROM public.customers ORDER BY customer_id ASC '
        });
    }
    function schemavalidation(response){
        const schema={
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "Generated schema for Root",
            "type": "object",
            "properties": {
              "customer_id": {"type": "number" },
              "erp_version": {"type": "string"},
              "supplier": {"type": "string"},
              "description": {"type": "string"  },
              "container_id": { "type": "string" },
              "customer_db_prefix": {  "type": "string"   },
              "subdomain": { "type": "string" },
              "local_url": {"type": "string"},
              "so_effective_date": {"type": "string"},
              "so_expiry_date": {"type": "string"},
              "payment_cycle": {"type": "string"},
              "active_seller": {"type": "boolean"},
              "active_buyer": {"type": "boolean"},
              "admin_user": {"type": "string"  },
              "admin_password": {"type": "string"},
              "app_user": {"type": "string"},
              "app_password": {"type": "string" }
            },
            "required": [ "customer_id","erp_version","supplier","description","container_id","customer_db_prefix","subdomain",
              "local_url","so_effective_date","so_expiry_date","payment_cycle", "active_seller","active_buyer",
              "admin_user", "admin_password","app_user","app_password"],
            "additionalProperties": false
          }
        const validity = avj.compile(schema);
        isvalid = validity(response.body);
    }
    function validation(response){
        const responseData = response.body;
                                //id
                                expect(responseData.customer_id).to.exist.and.to.be.at.least(1);
                                expect(responseData.container_id).to.be.equal("")
                                //erp version
                                const erp=responseData.erp_version;
                                const erpspace = !erp.startsWith(' ') || !erp.endsWith(' ') || erp.includes(' ');
                                expect(erpspace).to.be.true;
                                //supplier
                                expect(responseData.supplier).to.exist.and.to.not.be.empty;
                                const sup=responseData.supplier;
                                const supspace = !sup.startsWith(' ') || !sup.endsWith(' ') || sup.includes(' ');
                                expect(supspace).to.be.true;
                                expect(responseData.supplier).to.have.lengthOf.below(30)
                                //description
                                const des=responseData.description;
                                const desspace = !des.startsWith(' ') || !des.endsWith(' ') || des.includes(' ');
                                expect(desspace).to.be.true;
                                expect(responseData.description).to.have.lengthOf.below(30)
                                //customer db
                                const DB=responseData.customer_db_prefix;
                                const DBspace = !DB.startsWith(' ') || !DB.endsWith(' ') || DB.includes(' ');
                                expect(DBspace).to.be.true;
                                expect(responseData.customer_db_prefix).to.exist.and.to.not.be.empty; 
                                expect(responseData.customer_db_prefix).to.have.lengthOf.below(10);
                                //subdomain
                                const sub=responseData.subdomain;
                                const subspace = !sub.startsWith(' ') || !sub.endsWith(' ') || sub.includes(' ');
                                expect(subspace).to.be.true; 
                                expect(responseData.subdomain).to.exist.and.to.not.be.empty;
                                expect(responseData.subdomain).to.have.lengthOf.below(10)
                                //localurl
                                const lurl=responseData.local_url;
                                const lspace = !lurl.startsWith(' ') || !lurl.endsWith(' ') || lurl.includes(' ');
                                expect(lspace).to.be.true; 
                                expect(responseData.local_url).to.have.lengthOf.below(30);
                                //payment cycle
                                const pc=responseData.payment_cycle;
                                const pcspace = !pc.startsWith(' ') || !pc.endsWith(' ') || pc.includes(' ');
                                expect(pcspace).to.be.true; 
                                expect(responseData.payment_cycle).to.have.lengthOf.below(10);
                                //active,admin & app 
                                expect(responseData.active_seller).to.not.be.equal(""); 
                                expect(responseData.active_buyer).to.not.be.equal(""); 
                                expect(responseData.admin_user).to.be.equal("");
                                expect(responseData.admin_password).to.be.equal("");
                                expect(responseData.app_user).to.be.equal(""); 
                                expect(responseData.app_password).to.be.equal(""); 
                                //date
                                expect(responseData.so_effective_date).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/);
                                expect(responseData.so_expiry_date).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/);                            
                                 //expect(new Date(responseData.so_effective_date)).to.be.above(new Date(), "so_effective_dateshould be in the future");
                                //expect(new Date(responseData.so_expiry_dat)).to.be.above(new Date(), "so_expiry_date should be in the future");
                                expect(new Date(responseData.so_effective_date)).to.not.equal(new Date(responseData.so_expiry_date));
                                expect(new Date(responseData.so_effective_date)).to.be.lessThan(new Date(responseData.so_expiry_date), "so_effective_date should be before so_expiry_date");
                                expect(response.headers['content-type']).to.include("application/json");

    }
    function createresponse(response,inputData){
        if(inputData.supplier && inputData.customer_db_prefix && inputData.subdomain  && inputData.local_url && inputData.so_effective_date && inputData.so_expiry_date){
                   if (response.status ===201) {
                           cy.log(`Valid Data: ${JSON.stringify(inputData)}`);
                           expect(response.status).to.be.equal(201)
                           schemavalidation(response)
                           expect(isvalid).to.be.true;   
                           const responseData=response.body
                           readUsersFromDB().then((result) => {
                               const allcustomers = result.rows;
                               console.log(allcustomers);
                               const user = allcustomers.find(row => row.supplier === response.body.supplier);
                                if (user) {
                                   if (user.supplier === responseData.supplier &&  user.customer_db_prefix === responseData.customer_db_prefix && user.subdomain === responseData.subdomain && user.local_url===responseData.local_url && (inputData.so_effective_date)===(responseData.so_effective_date) &&
                                   (inputData.so_expiry_date===responseData.so_expiry_date)) {
                                           console.log("**customer details added successfully from database");
                                       } else {
                                           console.log("**customer details did not match");
                                       }
                                   } else {
                                       console.log("**customer did not match");
                                   }
                               } )
                         validation(response);
               }  else if(inputData.supplier===(" ") || inputData.customer_db_prefix===(" ") || inputData.subdomain===(" ")  || inputData.local_url===(' ') || inputData.so_effective_date===(" ") || inputData.so_expiry_date===(" ")){
                    expect(response.status).to.be.equal(400)
                    expect(response.body).to.be.oneOf(["Fill all the required fields",'parsing time "" as "2006-01-02T15:04:05Z07:00": cannot parse "" as "2006"'])
                    cy.log(`invalid payload- Status: ${response.status}, Body: ${JSON.stringify(response.body)}, Input: ${JSON.stringify(inputData)}`);        
           
           } else if(inputData.erp_version.length > 10 || inputData.customer_db_prefix.length > 10 || inputData.subdomain.length > 10 || inputData.payment_cycle.length > 10  ){
               expect(response.status).to.be.equal(500)
               expect(response.body).to.be.equal("ERROR: value too long for type character varying(10) (SQLSTATE 22001)")
               cy.log(`invalid payload- Status: ${response.status}, Body: ${JSON.stringify(response.body)}, Input: ${JSON.stringify(inputData)}`);        
           } else if(response.status===409  || response.status===400){
               expect(response.status).to.be.oneOf([409,400])
               expect(response.body).to.be.oneOf([
                   `parsing time "2023-01-01:00Z" as "2006-01-02T15:04:05Z07:00": cannot parse ":00Z" as "T"`,
                   `parsing time "2024-01-0:00:00Z" as "2006-01-02T15:04:05Z07:00": cannot parse "0:00:00Z" as "02"`,
                   'SoEffectiveDate cannot be after SoExpiryDate',
                   'subdomain root is already in use',
                   `customerDBPrefix ${inputData.customer_db_prefix}_ is already in use`,
                   `localURL ${inputData.local_url} is already in use`,
                   `supplier ${inputData.supplier} is already in use`,
               ]);                
               cy.log(`invalid payload- Status: ${response.status}, Body: ${JSON.stringify(response.body)}, Input: ${JSON.stringify(inputData)}`);        
          }else if(response.status === 401) {
           expect(response.status).to.be.equal(401)
           expect(response.body).to.be.equal("Admin authorization required")
           cy.log(`unauthorized- Status: ${response.status}, Body: ${JSON.stringify(response.body)}, Input: ${JSON.stringify(inputData)}`);
       }
        } else if(response.status === 400) {
                    expect(response.status).to.be.equal(400)
                    expect(response.body).to.be.oneOf(["Fill all the required fields",'parsing time "" as "2006-01-02T15:04:05Z07:00": cannot parse "" as "2006"'])
                    cy.log(`invalid payload- Status: ${response.status}, Body: ${JSON.stringify(response.body)}, Input: ${JSON.stringify(inputData)}`);        
               }
               
           }; 
       
    function updateresponse(response,inputData){
        if((inputData.supplier || inputData.customer_db_prefix || inputData.subdomain  || inputData.local_url || inputData.so_effective_date || inputData.so_expiry_date) ){
           if(response.status===200){
                           cy.log(`Valid Data: ${JSON.stringify(inputData)}`);
                            expect(response.status).to.be.equal(200)
                            schemavalidation(response)
                            expect(isvalid).to.be.true;
                            const responseData=response.body
                            readUsersFromDB().then((result) => {
                                const allcustomers = result.rows;
                                const user = allcustomers.find(row => row.supplier === response.body.supplier)
                                if (user) {
                                    if (user.supplier === responseData.supplier ||  user.customer_db_prefix === responseData.customer_db_prefix || user.subdomain === responseData.subdomain || user.local_url===responseData.local_url || (inputData.so_effective_date)===(responseData.so_effective_date) ||
                                    (inputData.so_expiry_date===responseData.so_expiry_date)) {
                                            console.log("**customer details updated successfully in database");
                                        } else {
                                            console.log("**customer details did not match");
                                        }
                                    } else {
                                        console.log("**customer did not match");
                                    }
                            });
                            validation(response);
           }else if(response.status===400 || response.status===409){
            expect(response.status).to.be.oneOf([409,400])
            expect(response.body).to.be.oneOf([
                'supplier  is already in use',
                `parsing time "2022T00:00:00Z" as "2006-01-02T15:04:05Z07:00": cannot parse "T00:00:00Z" as "-"`,
                `parsing time "2023-:00:00Z" as "2006-01-02T15:04:05Z07:00": cannot parse ":00:00Z" as "01"`,
                "Fill all the required fields",
                `parsing time " " as "2006-01-02T15:04:05Z07:00": cannot parse " " as "2006"`,
                'subdomain root is already in use',
                "SoEffectiveDate cannot be after SoExpiryDate",
                `localURL ${inputData.local_url} is already in use`,
                `supplier ${inputData.supplier} is already in use`,
                "subdomain  is already in use"
            ]);
               cy.log(`invalid payload- Status: ${response.status}, Body: ${JSON.stringify(response.body)}, Input: ${JSON.stringify(inputData)}`);        
           }else if(response.status === 401) {
            expect(response.status).to.be.equal(401)
            expect(response.body).to.be.equal("Admin authorization required")
            cy.log(`unauthorized- Status: ${response.status}, Body: ${JSON.stringify(response.body)}, Input: ${JSON.stringify(inputData)}`);
        }else if(response.status===500){
            expect(response.status).to.be.equal(500)
            expect(response.body).to.be.equal("ERROR: value too long for type character varying(10) (SQLSTATE 22001)")
               cy.log(`invalid payload- Status: ${response.status}, Body: ${JSON.stringify(response.body)}, Input: ${JSON.stringify(inputData)}`);        
                          
        } else if(response.status === 404) {
            expect(response.status).to.be.equal(404)
            expect(response.body).to.be.equal("Customer not found")
            cy.log(`not found- Status: ${response.status}, Body: ${JSON.stringify(response.body)}, Input: ${JSON.stringify(inputData)}`);
        }}else if(response.status === 400) {
            expect(response.status).to.be.equal(400)
            expect(response.body).to.be.oneOf(["Fill all the required fields",'parsing time "" as "2006-01-02T15:04:05Z07:00": cannot parse "" as "2006"'])
            cy.log(`invalid payload- Status: ${response.status}, Body: ${JSON.stringify(response.body)}, Input: ${JSON.stringify(inputData)}`);        
       }
        }
    function getresponse(response){
        if(response.status===200){
            cy.log(`Valid data- Status: ${response.status}, Body: ${JSON.stringify(response.body)}`);        
            expect(response.status).to.be.equal(200);
            schemavalidation(response)
            expect(isvalid).to.be.true;
            validation(response);
        }else if (response.status === 404) {
            throw new Error(`User not found - Status: ${response.status}, Body: ${JSON.stringify(response.body)}`);
        } else if (response.status === 500) {
            throw new Error(`Internal server down - Status: ${response.status}, Body: ${JSON.stringify(response.body)}`);
        }
    }
    function getallresponse(response) {
        if (response.status === 200) {
            expect(response.status).to.be.equal(200)
            cy.log(`response - Status: ${response.status}, Body: ${JSON.stringify(response.body)}`);
            const responseData=response.body;
            const schema = {
                "$schema": "http://json-schema.org/draft-07/schema#",
                "title": "Generated schema for Root",
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "customer_id": { "type": "number" },
                        "erp_version": { "type": "string" },
                        "supplier": { "type": "string" },
                        "description": { "type": "string" },
                        "container_id": { "type": "string" },
                        "customer_db_prefix": { "type": "string" },
                        "subdomain": { "type": "string" },
                        "local_url": { "type": "string" },
                        "so_effective_date": { "type": "string" },
                        "so_expiry_date": { "type": "string" },
                        "payment_cycle": { "type": "string" },
                        "active_seller": { "type": "boolean" },
                        "active_buyer": { "type": "boolean" },
                        "admin_user": { "type": "string" },
                        "admin_password": { "type": "string" },
                        "app_user": { "type": "string" },
                        "app_password": { "type": "string" }
                    },
                    "required": ["customer_id", "erp_version", "supplier", "description", "container_id", "customer_db_prefix",
                        "subdomain", "local_url", "so_effective_date", "so_expiry_date", "payment_cycle", "active_seller", "active_buyer",
                        "admin_user", "admin_password", "app_user", "app_password"],
                    "additionalProperties": false
                }
            }
            const validity = avj.compile(schema);
            const isvalid = validity(responseData);
            expect(isvalid).to.be.true;
            const seenIds = {};
            responseData.forEach((item) => {
                const Id = item.customer_id;
                expect(Id).to.be.a('number');
                expect(seenIds[Id]).to.be.undefined;
                seenIds[Id] = true;
                expect(Id).to.not.be.equal("");
                expect(item.customer_id).to.be.a('number').and.to.be.at.least(1);
                const erp = item.erp_version;
                const erpspace = !erp.startsWith(' ') || !erp.endsWith(' ') || erp.includes(' ');
                expect(erpspace).to.be.true;
                expect(erp === "" || erp.length >= 1).to.be.true;
                expect(erp).to.have.lengthOf.below(10)
                const sup = item.supplier;
                const supspace = !sup.startsWith(' ') || !sup.endsWith(' ') || sup.includes(' ');
                expect(supspace).to.be.true;
                expect(item.supplier).to.have.lengthOf.below(30)
                const encounteredSuppliers = new Set();
                expect(encounteredSuppliers.has(sup)).to.be.false;
                encounteredSuppliers.add(sup);
                const des = item.description;
                const desspace = !des.startsWith(' ') || !des.endsWith(' ') || des.includes(' ');
                expect(desspace).to.be.true;
                expect(des === "" || des.length >= 1).to.be.true;
                expect(des).to.have.lengthOf.below(30)
                const CID = item.container_id;
                const cspace = !CID.startsWith(' ') || !CID.endsWith(' ') || CID.includes(' ');
                expect(cspace).to.be.true;
                const encounteredcontainer_id = new Set();
                expect(encounteredcontainer_id.has(item.container_id)).to.be.false;
                encounteredcontainer_id.add(item.container_id);
                expect(CID === "" || CID.length >= 1).to.be.true;
                const DB = item.customer_db_prefix;
                expect(DB).to.not.be.equal("");
                const DBspace = !DB.startsWith(' ') || !DB.endsWith(' ') || DB.includes(' ');
                expect(DBspace).to.be.true;
                const encounteredcustomer_db_prefix = new Set();
                expect(encounteredcustomer_db_prefix.has(item.customer_db_prefix)).to.be.false;
                encounteredcustomer_db_prefix.add(item.customer_db_prefix);
                expect(item.customer_db_prefix).to.have.lengthOf.below(10);
                const sub = item.subdomain;
                const subspace = !sub.startsWith(' ') || !sub.endsWith(' ') || sub.includes(' ');
                expect(subspace).to.be.true;
                const encounteredsubdomain = new Set();
                expect(encounteredsubdomain.has(item.subdomain)).to.be.false;
                encounteredsubdomain.add(item.subdomain);
                expect(item.subdomain).to.have.lengthOf.below(10);
                const lurl = item.local_url;
                const lspace = !lurl.startsWith(' ') || !lurl.endsWith(' ') || lurl.includes(' ');
                expect(lspace).to.be.true;
                const encounteredlocal_url = new Set();
                expect(encounteredlocal_url.has(item.local_url)).to.be.false;
                encounteredlocal_url.add(item.local_url);
                expect(item.local_url).to.have.lengthOf.below(30);
                const pc = item.payment_cycle;
                expect(pc === "" || pc.length >= 1).to.be.true;
                const pcspace = !pc.startsWith(' ') || !pc.endsWith(' ') || pc.includes(' ');
                expect(pcspace).to.be.true;
                expect(item.payment_cycle).to.have.lengthOf.below(10);
                expect(item.active_seller).to.not.be.equal("");
                expect(item.active_buyer).to.not.be.equal("");
                expect(item.admin_user).to.be.equal("");
                expect(item.admin_password).to.be.equal("");
                expect(item.app_user).to.be.equal("");
                expect(item.app_password).to.be.equal("");
                expect(item.so_effective_date).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
                expect(item.so_expiry_date).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
                const effectiveDate = new Date(item.so_effective_date);
                const expiryDate = new Date(item.so_expiry_date);
                expect(effectiveDate).to.not.equal(expiryDate);
                expect(effectiveDate).to.be.lessThan(expiryDate, "so_effective_date should be before so_expiry_date");
            });
        } else if (response.status === 404) {
            throw new Error(`User not found - Status: ${response.status}, Body: ${JSON.stringify(response.body)}`);
        } else if (response.status === 500) {
            throw new Error(`Internal server down - Status: ${response.status}, Body: ${JSON.stringify(response.body)}`);
        }
    } 
    function deleteresponse(response){
        if (response.status === 200) {
            expect(response.status).to.be.equal(200);
            expect(response.body).to.be.equal("Customer deleted successfully")
            readUsersFromDB().then((result) => {
                const allcustomers = result.rows;
                let customerFound = false;
                allcustomers.forEach(user => {
                    if (parseInt(user.customer_id) === 6) {
                        customerFound = true;
                    } });
                if (customerFound) {
                    console.log("***customer not deleted"); 
                } else {
                    console.log("***customer deleted successfully in database"); }
            });
        } else if(response.status==404){
                    expect(response.status).to.be.equal(404)
                    expect(response.body).to.be.equal("Customer not found")
                    readUsersFromDB().then((result) => {
                        const allcustomers = result.rows;
                        let customerFound = false;
                        allcustomers.forEach(user => {
                            if (parseInt(user.customer_id) === 6) {
                                customerFound = true;
                            } });
                        if (customerFound) {
                            console.log("***customer id found in database"); 
                        } else {
                            console.log("***customer id not found  in database"); }
                    });
                    cy.log(`ID not found - Status: ${response.status}, Body: ${JSON.stringify(response.body)}`);
        }else if(response.status===401){
                    expect(response.status).to.be.equal(401)
                    expect(response.body).to.be.equal("Admin authorization required")
                    cy.log(`unauthorized - Status: ${response.status}, Body: ${JSON.stringify(response.body)}`);
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
            if (urls === data.createcustomer && methoding==="POST") {
                createresponse(response, inputData);
            }  
            else if (urls === data.updatecustomer && methoding==="PUT") {
                updateresponse(response, inputData);
            }else if(urls === data.getcustomer && methoding ==="GET"){
                getresponse(response)
            }else if(urls === data.getallcustomer && methoding ==="GET"){
                getallresponse(response)
            }else if(urls ===data.deletecustomer && methoding==="DELETE"){
                deleteresponse(response)
            }
            
        })
        });
    };
    it("Create by Admin", () => {
        bodydata.forEach((inputData) => {
        cy.fixture("url.json").then((data) => { 
            methoding="POST";
            makerequest("POST",  Cypress.env("token"), data.createcustomer, inputData);
        });
    })
    });
    it("Create by Normal", () => {
            const inputData = bodydata[0];
            cy.fixture("url.json").then((data) => { 
                methoding="POST";
                makerequest("POST",Cypress.env("normalusertoken"), data.createcustomer, inputData);
            });
    })
    it("Update by Admin", () => {
        updatebodydata.forEach((inputData) => {
        cy.fixture("url.json").then((data) => { 
            methoding="PUT";
            makerequest("PUT",  Cypress.env("token"), data.updatecustomer, inputData);
        });
    })
    });
    it("Update by Normal user", () => {
        cy.fixture("url.json").then((data) => { 
            const inputData = updatebodydata[0];
            makerequest("PUT", Cypress.env("normalusertoken"), data.updatecustomer, inputData);
        });
    });
    it(`Get by Admin`, () => {
        cy.fixture("url.json").then((data) => { 
        methoding="GET"
        makerequest("GET",Cypress.env("token"),data.getcustomer,null);
        })
    });
    it(`Get by Normal user`, () => {
        cy.fixture("url.json").then((data) => { 
        methoding="GET"
        makerequest("GET",Cypress.env("normalusertoken"),data.getcustomer,null);
        })
    });
    it(`Get all by Admin`, () => {
        cy.fixture("url.json").then((data) => { 
        methoding="GET"
        makerequest("GET",Cypress.env("token"),data.getallcustomer,null);
        })
    });
    it(`Get all by Normal user`, () => {
        cy.fixture("url.json").then((data) => { 
        methoding="GET"
        makerequest("GET",Cypress.env("normalusertoken"),data.getallcustomer,null);
        })
    });
    it(`Delete by Admin`, () => {
        cy.fixture("url.json").then((data) => { 
            methoding="DELETE";
            makerequest("DELETE",Cypress.env("token"),data.deletecustomer,null);
        })
     });
    it("Delete by Normal user", () => {
        cy.fixture("url.json").then((data) => { 
            methoding="DELETE";
            makerequest("DELETE",Cypress.env("normalusertoken"),data.deletecustomer,null);
    }) 
});
  
})
