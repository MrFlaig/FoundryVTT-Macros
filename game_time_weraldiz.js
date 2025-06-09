const { DialogV2 } = foundry.applications.api;

// ======================================================================
// COLOR DESIGN VARIABLES - FOUNDRY NATIVE WITH STRUCTURED HIERARCHY
// ======================================================================
const COLORS = {
    // Main interface colors using Foundry's CSS variables
    background: 'var(--color-bg-primary)',
    cardBackground: 'var(--color-bg-secondary)',
    cardBorder: 'var(--color-text-secondary)',
    controlBackground: 'var(--color-bg-tertiary)',
    controlBorder: 'var(--color-text-secondary)',

    // Text colors - structured hierarchy
    primaryText: 'var(--color-text-primary)',
    labelText: 'var(--color-text-secondary)',
    greyedText: 'var(--color-text-muted)',
    accentGold: 'var(--color-text-secondary)',

    // Icon colors - all use label color for consistency
    iconCalendar: 'var(--color-text-secondary)',
    iconSeason: 'var(--color-text-secondary)',
    iconFestival: 'var(--color-text-secondary)',
    iconMonth: 'var(--color-text-secondary)',
    iconDay: 'var(--color-text-secondary)',
    iconWeekday: 'var(--color-text-secondary)',
    iconLight: 'var(--color-text-secondary)',
    iconTime: 'var(--color-text-secondary)',

    // Input styling
    inputBorder: 'var(--color-text-secondary)',
    inputBackground: 'var(--color-bg-primary)',
    inputText: 'var(--color-text-primary)'
};

// ======================================================================
// WERALDIZ MOON SYSTEM - 3 MOONS CONFIGURATION
// ======================================================================
const WERALDIZ_MOONS = {
    moons: [
        {
            name: "Hwīlô",
            cycleLength: 59,  // Größter Mond, silbrig-weiß
            phaseNames: [
                "Neumond", "zunehmende Sichel", "zunehmender Halbmond", "zunehmender Mond",
                "Vollmond", "abnehmender Mond", "abnehmender Halbmond", "abnehmende Sichel"
            ],
            offset: 0,
        },
        {
            name: "Marōną",
            cycleLength: 67,  // Mittelgroß, bläulich schimmernd
            phaseNames: [
                "Neumond", "zunehmende Sichel", "zunehmender Halbmond", "zunehmender Mond",
                "Vollmond", "abnehmender Mond", "abnehmender Halbmond", "abnehmende Sichel"
            ],
            offset: 0,
        },
        {
            name: "Draupnaz",
            cycleLength: 113,  // Kleinster, zeitweise rötlich
            phaseNames: [
                "Neumond", "zunehmende Sichel", "zunehmender Halbmond", "zunehmender Mond",
                "Vollmond", "abnehmender Mond", "abnehmender Halbmond", "abnehmende Sichel"
            ],
            offset: 0,
        }
    ]
};

// ======================================================================
// SEASONAL DAYLIGHT CONFIGURATION - WERALDIZ 32-HOUR DAY SYSTEM
// ======================================================================
const DAYLIGHT_CONFIG = {
    // Schattenruhe always occurs from hour 14-19 (6 hours, 30% darkness)
    SCHATTENRUHE_START: 14,
    SCHATTENRUHE_END: 19,
    SCHATTENRUHE_DARKNESS: 0.70,

    // Seasonal sunrise/sunset times (hours 0-31)
    SEASONS: {
        // Frühling: Months 1-4 (Niwarunaz to Wahsijana)
        'Frühling': {
            monthStart: 1, monthEnd: 4,
            sunrise: 6, sunset: 26,
            description: 'Ausgeglichenes Licht, Dagaz gewinnt an Einfluss'
        },
        // Sommer: Months 5-8 (Hauhazsumaraz to Austwindaz)
        'Sommer': {
            monthStart: 5, monthEnd: 8,
            sunrise: 4, sunset: 28,
            description: 'Vollständige Dominanz von Dagaz'
        },
        // Spätsommer: Months 9-10 (Aftumistaskapa to Azgo)
        'Spätsommer': {
            monthStart: 9, monthEnd: 10,
            sunrise: 6, sunset: 27,
            description: 'Kurze Übergangszeit mit reicher Ernte'
        },
        // Herbst: Months 11-13 (Laubaleta to Fargetana)
        'Herbst': {
            monthStart: 11, monthEnd: 13,
            sunrise: 8, sunset: 24,
            description: 'Kaldaz gewinnt zunehmend an Einfluss'
        },
        // Winter: Months 14-16 (Frusiklo to Wana)
        'Winter': {
            monthStart: 14, monthEnd: 16,
            sunrise: 10, sunset: 22,
            description: 'Dominanz von Kaldaz mit bläulich-weißem Licht'
        }
    },

    // Darkness transition periods
    DAWN_DUSK_DARKNESS: 0.60,
    FULL_DARKNESS: 1.0,
    FULL_DAYLIGHT: 0.0
};

// ======================================================================
// CALENDAR CONSTANTS - WERALDIZ SYSTEM
// ======================================================================
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 32;
const DAYS_PER_WEEK = 8;
const DAYS_PER_MONTH = 32;
const MONTHS_PER_YEAR = 16;
const DAYS_PER_YEAR = 512;
const INTERCALARY_DAYS = 3;

const MONTH_NAMES = [
    "Niwarunaz", "Sedislagiþo", "Blostmaz", "Wahsijana",
"Hauhazsumaraz", "Hauhazsuna", "Frumistaskapa", "Austwindaz",
"Aftumistaskapa", "Azgo", "Laubaleta", "Unþargang",
"Fargetana", "Frusiklo", "Þaujana", "Wana"
];
const INTERCALARY_DAY_NAMES = ["Frijo", "Hlewagastiz", "Wurdiz"];
const WEEKDAY_NAMES = [
    "Liuhtją", "Sunją", "Stþaną", "Lībaną",
"Sēdiz", "Atimą", "þankijaną", "Aiwiskō"
];

// ======================================================================
// LIGHTING & SEASON HELPER FUNCTIONS
// ======================================================================
function getCurrentSeason(monthIndex) {
    for (const [seasonName, config] of Object.entries(DAYLIGHT_CONFIG.SEASONS)) {
        if (monthIndex >= config.monthStart && monthIndex <= config.monthEnd) {
            return { name: seasonName, config };
        }
    }
    return { name: 'Unbekannt', config: DAYLIGHT_CONFIG.SEASONS['Frühling'] };
}

function getLightingCondition(hour, seasonConfig) {
    const { sunrise, sunset } = seasonConfig;
    const { SCHATTENRUHE_START, SCHATTENRUHE_END } = DAYLIGHT_CONFIG;

    // Schattenruhe period
    if (hour >= SCHATTENRUHE_START && hour <= SCHATTENRUHE_END) {
        return {
            name: 'Schattenruhe',
            icon: 'fas fa-adjust',
            darkness: DAYLIGHT_CONFIG.SCHATTENRUHE_DARKNESS
        };
    }

    // Dawn period (1 hour before sunrise)
    if (hour === sunrise - 1 || (sunrise === 0 && hour === 31)) {
        return {
            name: 'Morgendämmerung',
            icon: 'fas fa-cloud-sun',
            darkness: DAYLIGHT_CONFIG.DAWN_DUSK_DARKNESS
        };
    }

    // Dusk period (1 hour after sunset)
    if (hour === sunset + 1 || (sunset === 31 && hour === 0)) {
        return {
            name: 'Abenddämmerung',
            icon: 'fas fa-cloud-moon',
            darkness: DAYLIGHT_CONFIG.DAWN_DUSK_DARKNESS
        };
    }

    // Full daylight
    if ((hour >= sunrise && hour < SCHATTENRUHE_START) ||
        (hour > SCHATTENRUHE_END && hour <= sunset)) {
        return {
            name: 'Tag',
            icon: 'fas fa-sun',
            darkness: DAYLIGHT_CONFIG.FULL_DAYLIGHT
        };
        }

        // Night
        return {
            name: 'Nacht',
            icon: 'fas fa-moon',
            darkness: DAYLIGHT_CONFIG.FULL_DARKNESS
        };
}

async function updateSceneDarkness(targetDarkness) {
    await canvas.scene.update({
        "environment.darknessLevel": targetDarkness
    }, { animateDarkness: true });
}

// ======================================================================
// MOON PHASE CALCULATIONS
// ======================================================================
function getCurrentMoonPhases(totalSeconds) {
    const days = Math.floor(totalSeconds / (SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY));

    return WERALDIZ_MOONS.moons.map(moon => {
        const cyclePosition = (days + moon.offset) % moon.cycleLength;
        const phaseIndex = Math.floor(cyclePosition / (moon.cycleLength / 8));
        const phaseName = moon.phaseNames[phaseIndex];

        // Get appropriate Font Awesome Pro icon based on phase
        let phaseIcon;
        switch(phaseIndex) {
            case 0: phaseIcon = "fal fa-circle"; break;                    // Neumond
            case 1: phaseIcon = "fal fa-moon-cloud"; break;                // zunehmende Sichel
            case 2: phaseIcon = "fal fa-moon"; break;                      // zunehmender Halbmond
            case 3: phaseIcon = "fas fa-moon"; break;                      // zunehmender Mond
            case 4: phaseIcon = "fas fa-circle"; break;                    // Vollmond
            case 5: phaseIcon = "fas fa-moon"; break;                      // abnehmender Mond
            case 6: phaseIcon = "fal fa-moon"; break;                      // abnehmender Halbmond
            case 7: phaseIcon = "fal fa-moon-cloud"; break;                // abnehmende Sichel
            default: phaseIcon = "fal fa-circle";
        }

        // Special color for Draupnaz when visible (phases 1-7, reddish tint)
        let phaseColor = COLORS.primaryText;
        if (moon.name === "Draupnaz" && phaseIndex > 0) {
            phaseColor = "#ffcccc"; // Leicht rötlicher Schimmer
        } else if (moon.name === "Marōną" && phaseIndex > 0) {
            phaseColor = "#ccddff"; // Leicht bläulicher Schimmer
        }

        return {
            name: moon.name,
            phase: phaseName,
            phaseIcon: phaseIcon,
            phaseColor: phaseColor,
            moonIcon: moon.icon,
        };
    });
}

// ======================================================================
// CALENDAR CALCULATION HELPERS
// ======================================================================
function hasIntercalaryDays(year) {
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
        { name: "Jahr",   seconds: SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY * DAYS_PER_YEAR },
        { name: "Monat",  seconds: SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY * DAYS_PER_MONTH },
        { name: "Woche",  seconds: SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY * DAYS_PER_WEEK },
        { name: "Tag",    seconds: SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY },
        { name: "Stunde", seconds: SECONDS_PER_MINUTE * MINUTES_PER_HOUR },
        { name: "Minute", seconds: SECONDS_PER_MINUTE },
        { name: "Sekunde", seconds: 1 }
    ];
    let result = "";
    for (const unit of units) {
        if (seconds >= unit.seconds) {
            const count = Math.floor(seconds / unit.seconds);
            result += `${count} ${unit.name}${count !== 1 ? "en" : ""} `;
            seconds %= unit.seconds;
        }
    }
    return result.trim() || "0 Sekunden";
}

// ======================================================================
// ENHANCED DATE FORMATTER WITH GRID LAYOUT
// ======================================================================
function formatWeraldizTimeStyled(totalSeconds) {
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
    let intercalaryDayNumber = 0; // Track which intercalary day (1, 2, or 3)

    let daysPassed = 0;
    for (let i = 0; i < MONTHS_PER_YEAR; i++) {
        if (i === 3 && hasIntercalaryDays(year)) {
            for (let j = 0; j < INTERCALARY_DAYS; j++) {
                if (remainingDays === daysPassed) {
                    isIntercalaryDay = true;
                    intercalaryDayName = INTERCALARY_DAY_NAMES[j];
                    intercalaryDayNumber = j + 1; // Store which day (1-3)
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

    const hours = Math.floor(remainingSeconds / (SECONDS_PER_MINUTE * MINUTES_PER_HOUR));
    remainingSeconds %= SECONDS_PER_MINUTE * MINUTES_PER_HOUR;
    const minutes = Math.floor(remainingSeconds / SECONDS_PER_MINUTE);
    const seconds = remainingSeconds % SECONDS_PER_MINUTE;

    // Get current season and lighting
    const season = getCurrentSeason(monthIndex + 1);
    const lighting = getLightingCondition(hours, season.config);

    // Get current moon phases
    const moonPhases = getCurrentMoonPhases(totalSeconds);

    // Weekday calculation
    const weekdayIndex = isIntercalaryDay ?
    (daysPassed) % DAYS_PER_WEEK :
    ((dayOfMonth - 1) % DAYS_PER_WEEK);
    const weekdayName = WEEKDAY_NAMES[weekdayIndex];

    // Determine grid layout based on what's being shown
    const gridColumns = isIntercalaryDay ? "1fr 1fr" : "1fr 1fr";

    let html = `
    <div style="
    display: grid;
    grid-template-columns: ${gridColumns};
    gap: 15px 25px;
    margin: 10px 0;
    padding: 15px;
    background: ${COLORS.cardBackground};
    border-radius: 8px;
    border: 1px solid ${COLORS.cardBorder};
    font-family: 'Modesto Condensed', serif;
    ">
    <div style="display: flex; align-items: center; font-size: 1.1em;">
    <i class="fas fa-calendar-alt" style="margin-right: 8px; color: ${COLORS.labelText}; min-width: 20px;"></i>
    <span style="font-weight: bold; color: ${COLORS.labelText}; min-width: 60px;">Jahr:</span>
    <span style="color: ${COLORS.primaryText};">${year} WZ</span>
    </div>

    <div style="display: flex; align-items: center; font-size: 1.1em;">
    <i class="fas fa-leaf" style="margin-right: 8px; color: ${COLORS.labelText}; min-width: 20px;"></i>
    <span style="font-weight: bold; color: ${COLORS.labelText}; min-width: 60px;">Jahreszeit:</span>
    <span style="color: ${COLORS.primaryText};">${season.name}</span>
    </div>`;

    if (isIntercalaryDay) {
        // For intercalary days: show formatted Festtag spanning full width, hide regular day/weekday fields
        html += `
        <div style="display: flex; align-items: center; font-size: 1.1em; grid-column: 1 / -1; justify-self: center; background: rgba(255, 215, 0, 0.1); padding: 15px; border-radius: 6px; border: 1px solid rgba(255, 215, 0, 0.3);">
        <i class="fas fa-star" style="margin-right: 8px; color: #ffdf00; min-width: 20px;"></i>
        <span style="font-weight: bold; color: #ffdf00; min-width: 60px;">Festtag:</span>
        <span style="color: ${COLORS.primaryText}; font-weight: 600;">${intercalaryDayName} (${intercalaryDayNumber} von 3)</span>
        </div>`;
    } else {
        // For normal days: show month, day, and weekday
        html += `
        <div style="display: flex; align-items: center; font-size: 1.1em;">
        <i class="fas fa-calendar-day" style="margin-right: 8px; color: ${COLORS.labelText}; min-width: 20px;"></i>
        <span style="font-weight: bold; color: ${COLORS.labelText}; min-width: 60px;">Monat:</span>
        <span style="color: ${COLORS.primaryText};">${MONTH_NAMES[monthIndex]} <span style="color: ${COLORS.greyedText};">(${monthIndex + 1} von ${MONTHS_PER_YEAR})</span></span>
        </div>

        <div style="display: flex; align-items: center; font-size: 1.1em;">
        <i class="fas fa-clock" style="margin-right: 8px; color: ${COLORS.labelText}; min-width: 20px;"></i>
        <span style="font-weight: bold; color: ${COLORS.labelText}; min-width: 60px;">Tag:</span>
        <span style="color: ${COLORS.primaryText};">${dayOfMonth}. Tag <span style="color: ${COLORS.greyedText};">(von ${DAYS_PER_MONTH})</span></span>
        </div>

        <div style="display: flex; align-items: center; font-size: 1.1em;">
        <i class="fas fa-calendar-week" style="margin-right: 8px; color: ${COLORS.labelText}; min-width: 20px;"></i>
        <span style="font-weight: bold; color: ${COLORS.labelText}; min-width: 60px;">Wochentag:</span>
        <span style="color: ${COLORS.primaryText};">${weekdayName} <span style="color: ${COLORS.greyedText};">(${weekdayIndex + 1} von ${DAYS_PER_WEEK})</span></span>
        </div>`;
    }

    html += `
    <div style="display: flex; align-items: center; font-size: 1.1em; ${isIntercalaryDay ? 'grid-column: 1 / -1; justify-self: center;' : ''}">
    <i class="${lighting.icon}" style="margin-right: 8px; color: ${COLORS.labelText}; min-width: 20px;"></i>
    <span style="font-weight: bold; color: ${COLORS.labelText}; min-width: 60px;">Licht:</span>
    <span style="color: ${COLORS.primaryText};">${lighting.name}</span>
    </div>

    <div style="
    display: flex;
    align-items: center;
    font-size: 1.3em;
    grid-column: 1 / -1;
    justify-content: center;
    margin-top: 10px;
    padding-top: 15px;
    border-top: 1px solid ${COLORS.cardBorder};
    ">
    <i class="fas fa-clock" style="margin-right: 10px; color: ${COLORS.labelText};"></i>
    <span style="font-weight: bold; color: ${COLORS.primaryText}; font-size: 1.4em;">
    ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}
    </span>
    </div>
    </div>`;

    // Add Moon Phases Section
    html += `
    <div style="
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 15px;
    margin: 15px 0;
    padding: 15px;
    background: ${COLORS.cardBackground};
    border-radius: 8px;
    border: 1px solid ${COLORS.cardBorder};
    font-family: 'Modesto Condensed', serif;
    ">`;

    moonPhases.forEach(moon => {
        html += `
        <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 10px;
        ">
        <div style="
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        font-size: 1.1em;
        ">
        <i class="${moon.moonIcon}" style="margin-right: 6px; color: ${COLORS.labelText};"></i>
        <span style="font-weight: bold; color: ${COLORS.labelText};">${moon.name}</span>
        </div>
        <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        ">
        <i class="${moon.phaseIcon}" style="font-size: 1.8em; color: ${moon.phaseColor}; margin-bottom: 5px;"></i>
        <span style="color: ${COLORS.primaryText}; font-size: 0.9em;">${moon.phase}</span>
        </div>
        </div>`;
    });

    html += `</div>`;

    return { html, lighting };
}

// ======================================================================
// DIALOG UPDATE/ACTION HELPERS
// ======================================================================
function updateDisplayedTime(element) {
    if (element) {
        const { html, lighting } = formatWeraldizTimeStyled(game.time.worldTime);
        element.innerHTML = html;

        // Auto-update scene darkness based on current time
        updateSceneDarkness(lighting.darkness);
    }
}

async function changeTime(amount, unit, timeElement) {
    const seconds = getSecondsForUnit(unit, amount);
    await game.time.advance(seconds);
    updateDisplayedTime(timeElement);
    ui.notifications.info(`Zeit ${seconds >= 0 ? 'vorangeschritten' : 'zurückgesetzt'} um ${formatHumanReadableTime(Math.abs(seconds))}`);
}

// ======================================================================
// MAIN DIALOG CONTENT AND LAUNCH
// ======================================================================
const { html: currentTime } = formatWeraldizTimeStyled(game.time.worldTime);

const content = `
<div style="
display: grid;
grid-template-columns: 1fr;
gap: 20px;
font-family: 'Modesto Condensed', serif;
border-radius: 10px;
padding: 20px;
">
<!-- Current Time Display -->
<div id="current-time">${currentTime}</div>

<!-- Time Control Section -->
<div style="
display: grid;
grid-template-columns: 2fr 3fr;
gap: 15px;
align-items: end;
padding: 20px;
border-radius: 8px;
border: 1px solid ${COLORS.controlBorder};
">
<div>
<label style="display: block; font-weight: bold; color: ${COLORS.labelText}; margin-bottom: 8px;">Menge:</label>
<input
type="number"
name="time-amount"
value="1"
min="1"
style="
width: 100%;
padding: 8px;
border: 1px solid ${COLORS.inputBorder};
border-radius: 4px;
color: ${COLORS.inputText};
font-size: 1.1em;
"
>
</div>

<div>
<label style="display: block; font-weight: bold; color: ${COLORS.labelText}; margin-bottom: 8px;">Einheit:</label>
<select
name="time-unit"
style="
width: 100%;
padding: 8px;
border: 1px solid ${COLORS.inputBorder};
border-radius: 4px;
color: ${COLORS.inputText};
font-size: 1.1em;
"
>
<option value="seconds">Sekunden</option>
<option value="minutes">Minuten</option>
<option value="hours" selected>Stunden</option>
<option value="days">Tage</option>
<option value="weeks">Wochen</option>
<option value="months">Monate</option>
<option value="years">Jahre</option>
</select>
</div>
</div>
</div>
`;

const dialog = new DialogV2({
    window: {
        title: "Weraldiz Zeit & Licht Kontrolle",
        minimizable: true,
        resizable: true
    },
    position: {
        width: 700,
        height: "auto"
    },
    content: content,
    buttons: [
        {
            action: "decrease",
            label: "",
            icon: "fas fa-backward",
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
            label: "",
            icon: "fas fa-forward",
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
            label: "",
            icon: "fa-solid fa-circle-xmark",
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
