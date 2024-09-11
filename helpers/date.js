// date_helper.js





// Function to format date in 'MM-DD-YYYY' format
function formatDate(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    let year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [month, day, year].join('-');
}

// Function to get the difference in days between two dates
function dateDifference(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Function to get the current date in 'YYYY-MM-DD' format
function getCurrentDate() {
    const date = new Date();
    return date.toISOString().slice(0, 10); // Returns 'YYYY-MM-DD'
}

// Function to add days to a given date
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

module.exports = {
    formatDate,
    dateDifference,
    getCurrentDate,
    addDays
};
