const RANKS = new Map([
    [0,  { label: "Default",       color: "#AAAAAA" }], // §7  Gray
    [6,  { label: "VIP",           color: "#ddb815" }], // §e  Yellow (hue 59°, 4.9:1)
    [8,  { label: "Pro",           color: "#5555ff" }], // §9  Blue
    [17, { label: "Supreme",       color: "#FF5555" }], // §c  Red
    [3,  { label: "Trainee",       color: "#00AA00" }], // §2  Dark Green
    [4,  { label: "Moderator",     color: "#ffa600" }], // §6  Gold
    [16, { label: "Sr. Moderator", color: "#0fc2da" }], // §3  Dark Aqua
    [12, { label: "Staff Manager", color: "#FF5555" }], // §c  Red
    [7,  { label: "Supervisor",    color: "#0fc2da" }], // §3  Dark Aqua
    [13, { label: "Director",      color: "#FF5555" }], // §c  Red
    [14, { label: "Builder",       color: "#ffa600" }], // §6  Gold
    [9,  { label: "QA",            color: "#00AA00" }], // §a  Green  (darkened for light bg, 4.6:1)
    [10, { label: "Media",         color: "#1795b8" }], // §b  Aqua   (darkened for light bg, 4.9:1)
    [11, { label: "Partner",       color: "#1795b8" }], // §b  Aqua   (darkened for light bg, 4.9:1)
    [5,  { label: "Developer",     color: "#ffa600" }], // §6  Gold
    [18, { label: "HR",            color: "#FF55FF" }], // §d  Light Purple
    [1,  { label: "Admin",         color: "#FF5555" }], // §c  Red
    [2,  { label: "Owner",         color: "#FF5555" }], // §c  Red
    [19, { label: "TW",            color: "#FF55FF" }], // §d  Light Purple
]);

export { RANKS };
