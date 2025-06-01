const { DialogV2 } = foundry.applications.api;

// === Custom Calendar Constants ===
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 32;
const DAYS_PER_WEEK = 8;
const DAYS_PER_MONTH = 32;
const MONTHS_PER_YEAR = 16;
const DAYS_PER_YEAR = 512;
const INTERCALARY_DAYS = 3; // Frijo, Hlewagastiz, Wurdiz

const MONTH_NAMES = [
    "Niwarunaz", "Sedislagiþo", "Blostmaz", "Wahsijana",
"Hauhazsumaraz", "Hauhazsuna", "Frumistaskapa", "Austwindaz",
"Aftumistaskapa", "Azgo", "Laubaleta", "Unþargang",
"Fargetana", "Frusiklo", "Þaujana", "Wana"
];
const INTERCALARY_DAY_NAMES = ["Frijo", "Hlewagastiz", "Wurdiz"];
const WEEKDAY_NAMES = [
    "Sunnunaz", "Monanaz", "Tiwaz", "Wodananaz",
"Þunaranaz", "Frijonaz", "Saturnaz", "Aurinanaz"
];

// === Calendar Calculation Helpers ===
function hasIntercalaryDays(year) {
    // Intercalary days occur every 5 years (years 1, 6, 11, 16, etc.)
    return year % 5 === 1;
}

function getSecondsForUnit(unit, value) {
    switch (unit) {
        case "seconds": return value;
        case "minutes": return value * SECONDS_PER_MINUTE;
        case "hours":   return value * SECONDS_PER_MINUTE * MINUTES_PER_HOUR;
        case "days":    return value * SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY;
        case "weeks":   return value * SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY * DAYS_PER_WEEK;
        case "months":  return value * SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY * DAYS_PER_MONTH;
        case "years":   return value * SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY * DAYS_PER_YEAR;
        default: return 0;
    }
}

function formatHumanReadableTime(seconds) {
    const units = [
        { name: "year",   seconds: SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY * DAYS_PER_YEAR },
        { name: "month",  seconds: SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY * DAYS_PER_MONTH },
        { name: "week",   seconds: SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY * DAYS_PER_WEEK },
        { name: "day",    seconds: SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY },
        { name: "hour",   seconds: SECONDS_PER_MINUTE * MINUTES_PER_HOUR },
        { name: "minute", seconds: SECONDS_PER_MINUTE },
        { name: "second", seconds: 1 }
    ];
    let result = "";
    for (const unit of units) {
        if (seconds >= unit.seconds) {
            const count = Math.floor(seconds / unit.seconds);
            result += `${count} ${unit.name}${count !== 1 ? "s" : ""} `;
            seconds %= unit.seconds;
        }
    }
    return result.trim() || "0 seconds";
}

// === Main Formatter: Styled Block with Weekday Support ===
function formatCustomTimeStyled(totalSeconds) {
    let days = Math.floor(totalSeconds / (SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY));
    let remainingSeconds = totalSeconds % (SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY);

    if (remainingSeconds < 0) {
        remainingSeconds += SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY;
        days--;
    }

    let year = 1;
    let remainingDays = days;

    if (remainingDays < 0) {
        while (remainingDays < 0) {
            year--;
            remainingDays += DAYS_PER_YEAR + (hasIntercalaryDays(year) ? INTERCALARY_DAYS : 0);
        }
    } else {
        while (true) {
            const daysInYear = DAYS_PER_YEAR + (hasIntercalaryDays(year) ? INTERCALARY_DAYS : 0);
            if (remainingDays < daysInYear) break;
            remainingDays -= daysInYear;
            year++;
        }
    }

    let monthIndex = 0;
    let dayOfMonth = 0;
    let isIntercalaryDay = false;
    let intercalaryDayName = "";

    let daysPassed = 0;
    for (let i = 0; i < MONTHS_PER_YEAR; i++) {
        if (i === 3 && hasIntercalaryDays(year)) {
            for (let j = 0; j < INTERCALARY_DAYS; j++) {
                if (remainingDays === daysPassed) {
                    isIntercalaryDay = true;
                    intercalaryDayName = INTERCALARY_DAY_NAMES[j];
                    break;
                }
                daysPassed++;
            }
            if (isIntercalaryDay) break;
        }
        if (remainingDays < daysPassed + DAYS_PER_MONTH) {
            monthIndex = i;
            dayOfMonth = remainingDays - daysPassed + 1;
            break;
        }
        daysPassed += DAYS_PER_MONTH;
    }
    let weekOfMonth = Math.ceil(dayOfMonth / DAYS_PER_WEEK);

    const hours = Math.floor(remainingSeconds / (SECONDS_PER_MINUTE * MINUTES_PER_HOUR));
    remainingSeconds %= SECONDS_PER_MINUTE * MINUTES_PER_HOUR;
    const minutes = Math.floor(remainingSeconds / SECONDS_PER_MINUTE);
    const seconds = remainingSeconds % SECONDS_PER_MINUTE;

    let html = `<div class="weraldiz-calendar-block">`;
    html += `<div><b>Year:</b> ${year}</div>`;
    if (isIntercalaryDay) {
        html += `<div><b>Special Day:</b> ${intercalaryDayName}</div>`;
        // Show weekday for intercalary days (optional; can omit if not wanted)
        const weekdayIndex = (daysPassed) % DAYS_PER_WEEK;
        const weekdayName = WEEKDAY_NAMES[weekdayIndex];
        html += `<div><b>Weekday:</b> ${weekdayName} <span style="color:#888">(Day ${weekdayIndex + 1} of ${DAYS_PER_WEEK})</span></div>`;
    } else {
        html += `<div><b>Month:</b> ${MONTH_NAMES[monthIndex]} <span style="color:#888">(${monthIndex + 1}/${MONTHS_PER_YEAR})</span></div>`;
        html += `<div><b>Day:</b> ${dayOfMonth} <span style="color:#888">of ${DAYS_PER_MONTH}</span></div>`;
        html += `<div><b>Week:</b> ${weekOfMonth} <span style="color:#888">of ${Math.ceil(DAYS_PER_MONTH / DAYS_PER_WEEK)}</span></div>`;
        const weekdayIndex = ((dayOfMonth - 1) % DAYS_PER_WEEK);
        const weekdayName = WEEKDAY_NAMES[weekdayIndex];
        html += `<div><b>Weekday:</b> ${weekdayName} <span style="color:#888">(Day ${weekdayIndex + 1} of ${DAYS_PER_WEEK})</span></div>`;
    }
    html += `<div><b>Time:</b> ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}</div>`;
    html += `</div>`;
    return html;
}

// === Inline CSS Injection for Styled Block ===
if (!document.getElementById("weraldiz-calendar-css")) {
    const style = document.createElement("style");
    style.id = "weraldiz-calendar-css";
    style.textContent = `
    .weraldiz-calendar-block {
        margin: 6px 0 6px 0;
        padding: 12px 0 8px 0;
        font-size: 1.1em;
    }
    .weraldiz-calendar-block b {
        color: #fff;
        min-width: 88px;
        display: inline-block;
    }
    `;
    document.head.appendChild(style);
}

// === Dialog Update/Action Helpers ===
function updateDisplayedTime(element) {
    if (element) {
        element.innerHTML = formatCustomTimeStyled(game.time.worldTime);
    }
}

async function changeTime(amount, unit, timeElement) {
    const seconds = getSecondsForUnit(unit, amount);
    await game.time.advance(seconds);
    updateDisplayedTime(timeElement);
    ui.notifications.info(`Time ${seconds >= 0 ? 'advanced' : 'decreased'} by ${formatHumanReadableTime(Math.abs(seconds))}`);
}

// === Dialog Content and Launch ===
const currentTime = formatCustomTimeStyled(game.time.worldTime);
const content = `
<div class="time-control">
<div class="form-group" style="margin: 0 0 5px 0">
<label>Amount:</label>
<input type="number" name="time-amount" value="1" min="1">
</div>
<div class="form-group" style="margin: 0 0 5px 0">
<label>Unit:</label>
<select name="time-unit">
<option value="seconds">Seconds</option>
<option value="minutes">Minutes</option>
<option value="hours">Hours</option>
<option value="days">Days</option>
<option value="weeks">Weeks</option>
<option value="months">Months</option>
<option value="years">Years</option>
</select>
</div>
<div class="form-group time-current" style="margin: 0 0 5px 0">
<label>World Time:</label>
<div id="current-time">${currentTime}</div>
</div>
</div>
`;

const dialog = new DialogV2({
    window: {
        title: "Advance Game Time (Weraldiz)",
                            minimizable: true,
                            resizable: true
    },
    position: {
        width: 600,
        height: "auto"
    },
    content: content,
    buttons: [
        {
            action: "decrease",
            label: "<< Decrease",
            callback: async (event, button) => {
                const formData = new FormDataExtended(button.form).object;
                const amount = parseInt(formData["time-amount"]);
                const unit = formData["time-unit"];
                const timeElement = button.form.closest(".window-content")?.querySelector("#current-time");
                await changeTime(-amount, unit, timeElement);
                return false;
            }
        },
        {
            action: "advance",
            label: "Advance >>",
            default: true,
                callback: async (event, button) => {
                    const formData = new FormDataExtended(button.form).object;
                    const amount = parseInt(formData["time-amount"]);
                    const unit = formData["time-unit"];
                    const timeElement = button.form.closest(".window-content")?.querySelector("#current-time");
                    await changeTime(amount, unit, timeElement);
                    return false;
                }
        },
        {
            action: "close",
            label: "Close",
            callback: () => {
                dialog.close();
            }
        }
    ],
    form: {
        closeOnSubmit: false
    }
});

dialog.render({ force: true });
