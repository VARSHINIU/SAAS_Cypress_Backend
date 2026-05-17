const { defineConfig } = require("cypress");
const  pg=require("pg")

module.exports = defineConfig({
  // Set the viewport width to 1000 pixels
  viewportWidth: 1000,

  // Set the viewport height to 660 pixels
  viewportHeight: 660,

  // Configuration for end-to-end (e2e) tests
  e2e: {
    reporter: 'mochawesome',
    reporterOptions: {
      reportDir: 'cypress/reports/mocha',
      overwrite: false,
      html: true,  // Generates HTML report
      json: true   // Generates JSON report
    },
    setupNodeEvents(on, config) {
      on("task",{
        READFROMDB({dbconfig,sql}){
          const client =new pg.Pool(dbconfig);
          return client.query(sql);
        }
      })
    },
  },
  DB:{
    user:"postgres",//database user
    host:"localhost",//host
    database:"saas",//database name
    password:"1234",//database password
    port:"5432"//port number
}
,
  component: {
    devServer: {
      framework: "vue",
      bundler: "webpack",
    },
  },

  // Define environment variables
  
});
