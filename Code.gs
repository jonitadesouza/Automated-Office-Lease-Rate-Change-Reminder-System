function sendReminders() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Office _Occupancy");
  if (!sheet) {
    Logger.log("Error: Sheet not found!");
    return;
  }

  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var data = sheet.getDataRange().getValues();
  var reminderIntervals = [30, 20, 10];

  for (var i = 1; i < data.length; i++) {
    var serialNo = data[i][0];     // Column A
    var company = data[i][1];      // Column B
    var officeSpace = data[i][4];  // Column E

    if (!officeSpace || officeSpace.toString().trim() === "") continue;

    if ((!serialNo || serialNo.toString().trim() === "") &&
        (!company || company.toString().trim() === "")) {
      Logger.log(`Row ${i + 1}: Office ${officeSpace} is vacant. Skipping...`);
      continue;
    }

    var displayCompany = company && company.trim() !== "" ? company : "Unnamed Company";
    var emailRecipients = data[i][21]; // Column V
    if (!emailRecipients || emailRecipients.trim() === "") continue;

    var rateChangeDates = [data[i][13], data[i][15]]; // Columns N, P
    var leaseEndDate = data[i][17];                  // Column R
    var extensionEndDates = [data[i][18], data[i][19], data[i][20]]; // Columns S, T, U

    function sendEmailReminder(type, reminderNumber, date, subjectPrefix) {
      var dateStr = Utilities.formatDate(date, Session.getScriptTimeZone(), "dd MMM yyyy");
      Logger.log(`Sending ${type} Reminder ${reminderNumber} to ${emailRecipients}`);

      MailApp.sendEmail({
        to: emailRecipients,
        subject: `${subjectPrefix} | Reminder ${reminderNumber} of 3 | ${displayCompany}`,
        htmlBody: `
          <p>Dear Team,</p>
          <p>This is a <strong>${type}</strong> notification for 
          <strong style="color:blue;">${displayCompany}</strong> (Office: 
          <strong style="color:red;">${officeSpace}</strong>).</p>
          <p>The relevant date is <strong>${dateStr}</strong>.</p>
          <p>Please take necessary action.</p>
          <p>Best,<br>Admin</p>`
      });
    }

    // Rate Change Reminders
    rateChangeDates.forEach(function (dateStr) {
      if (dateStr) {
        var date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          date.setHours(0, 0, 0, 0);
          var daysLeft = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
          reminderIntervals.forEach(function (days, idx) {
            if (daysLeft === days) {
              sendEmailReminder("Rate Change", idx + 1, date, "Rate Change");
            }
          });
        }
      }
    });

    // Lease End Reminders
    if (leaseEndDate) {
      var date = new Date(leaseEndDate);
      if (!isNaN(date.getTime())) {
        date.setHours(0, 0, 0, 0);
        var daysLeft = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
        reminderIntervals.forEach(function (days, idx) {
          if (daysLeft === days) {
            sendEmailReminder("Lease End", idx + 1, date, "Lease End");
          }
        });
      }
    }

    // Extension Reminders (Columns S, T, U)
    extensionEndDates.forEach(function (extDate, extIdx) {
      if (extDate) {
        var date = new Date(extDate);
        if (!isNaN(date.getTime())) {
          date.setHours(0, 0, 0, 0);
          var daysLeft = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
          reminderIntervals.forEach(function (days, idx) {
            if (daysLeft === days) {
              sendEmailReminder(`Extension ${extIdx + 1} End`, idx + 1, date, "Extension End");
            }
          });
        }
      }
    });
  }
}
