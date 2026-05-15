import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

const newEmployeesData = [
  { pId: "CPH032", name: "SALHA NASSER HASSAN FALAMARZI", desig: "HAPPINESS CONSULTANT", hire: "2022-12-05", loc: "ONLINE-EMIRATI", nat: "Emirati", passAvail: "", passNo: "", dob: "", issue: "", expiry: "", address: "", pno: "" },
  { pId: "CPH052", name: "ALAAALLAH YASER ELSAYED MOHAMED SHAHWAN", desig: "LEGAL CONSULTANT", hire: "2025-02-25", loc: "CPH1", nat: "Egyptian", passAvail: "", passNo: "", dob: "", issue: "", expiry: "", address: "", pno: "" },
  { pId: "CPH048", name: "MOHAMMED ABDALLA ALSWAIDI", desig: "HAPPINESS CONSULTANT", hire: "2025-12-01", loc: "ONLINE-EMIRATI", nat: "Emirati", passAvail: "", passNo: "", dob: "", issue: "", expiry: "", address: "", pno: "" },
  { pId: "CPH049", name: "SHIWANI GERA", desig: "ADMINISTRATION", hire: "2019-11-01", loc: "ONLINE", nat: "Indian", passAvail: "", passNo: "", dob: "", issue: "", expiry: "", address: "", pno: "" },
  { pId: "CPH010", name: "BRENDA CASTILLO ABRIL", desig: "FO DUTY MANAGER", hire: "2015-07-09", loc: "CPH1", nat: "PHILIPPINES", passAvail: "Y", passNo: "P1015388B", dob: "1981-09-18", issue: "2019-03-12", expiry: "2019-03-11", address: "", pno: "" },
  { pId: "CPH017", name: "JAHABARALI RAJ MOHAMED", desig: "SECURITY", hire: "2021-10-25", loc: "CPH1", nat: "Indian", passAvail: "", passNo: "", dob: "", issue: "", expiry: "", address: "", pno: "" },
  { pId: "CPH021", name: "MOHAMMED FAKHARUDDIN FAZLULL", desig: "DRIVER", hire: "2011-10-23", loc: "CPH1", nat: "Bangladeshi", passAvail: "", passNo: "", dob: "", issue: "", expiry: "", address: "", pno: "" },
  { pId: "CPH024", name: "NAZMUL HASSAN JEBAL HOSAIN", desig: "Sr.BELL BOY", hire: "2011-10-23", loc: "CPH1", nat: "BANGLADESH", passAvail: "Y", passNo: "A03401562", dob: "1975-01-01", issue: "2022-03-28", expiry: "2032-03-27", address: "SOUTHBAGA CHATAR, SITTAKUNDA,KOMOR ALI - 4311. CHATTOGRAM", pno: "1518700000000" },
  { pId: "CPH027", name: "RAFIK KHAN SAHABUDDIN KHAN", desig: "RECEPTIONIST", hire: "2022-08-10", loc: "CPH1", nat: "Indian", passAvail: "", passNo: "", dob: "", issue: "", expiry: "", address: "", pno: "" },
  { pId: "CPH034", name: "SHAIFUL ISLAM NURUL MOSTAFA", desig: "SECURITY", hire: "2011-10-23", loc: "CPH1", nat: "Bangladeshi", passAvail: "", passNo: "", dob: "", issue: "", expiry: "", address: "", pno: "" },
  { pId: "CPH051", name: "ASHFAQUE RAJMOHAMMED SHAIKH", desig: "Asst.FRONT OFFICE MANAGER", hire: "2025-09-20", loc: "CPH1", nat: "INDIA", passAvail: "Y", passNo: "S4725569", dob: "1986-05-12", issue: "2018-04-16", expiry: "2028-04-15", address: "FLAT NO 9 HARI KRUPA APTS NEAR AHHIRAGATE SHIVANE PUNE 411 023", pno: "" },
  { pId: "CPH008", name: "ABUL BASHAR ABUL KALAM", desig: "HOUSE KEEPING BOY", hire: "2012-05-12", loc: "CPH1", nat: "BANGLADESH", passAvail: "Y", passNo: "A21613074", dob: "1988-06-03", issue: "2026-02-04", expiry: "2036-02-03", address: "", pno: "5575413843" },
  { pId: "CPH009", name: "BAL KUMAR BAGHA", desig: "HOUSE KEEPING BOY", hire: "2021-08-23", loc: "CPH1", nat: "Nepali", passAvail: "", passNo: "", dob: "", issue: "", expiry: "", address: "", pno: "" },
  { pId: "CPH014", name: "DULAL DAS AMULYA DAS", desig: "H/K SUPERVISOR (NIGHT)", hire: "2011-10-23", loc: "CPH1", nat: "Bangladeshi", passAvail: "", passNo: "", dob: "", issue: "", expiry: "", address: "", pno: "" },
  { pId: "CPH030", name: "RIDOY CHANDRA DEB", desig: "HOUSE KEEPING BOY", hire: "2021-05-22", loc: "CPH1", nat: "BANGLADESH", passAvail: "Y", passNo: "A19221836", dob: "1997-10-12", issue: "2025-06-30", expiry: "2035-06-29", address: "SONTUSPUR, MADHABPUR, ITAKHOLA - 3331, HABIGANJ", pno: "1031013103" },
  { pId: "CPH041", name: "SUNIL KUMAR PURAN CHAND", desig: "HOUSE KEEPING BOY", hire: "2019-10-12", loc: "CPH1", nat: "INDIA", passAvail: "Y", passNo: "S8792848", dob: "1999-02-06", issue: "2019-07-09", expiry: "2019-07-08", address: "VILL BHALWAL BHARTH PO PARGWAL,JAMMU PIN:181207,JAMMU AND KASHMIR,INDIA", pno: "" },
  { pId: "CPH015", name: "FRANSISCO VALENTE ESTIBEIRO", desig: "F&B CAPTAIN", hire: "2011-10-23", loc: "CPH1", nat: "Indian", passAvail: "", passNo: "", dob: "", issue: "", expiry: "", address: "", pno: "" },
  { pId: "CPH031", name: "RISHIRAM GHALAN", desig: "WAITER", hire: "2018-03-15", loc: "CPH1", nat: "NEPAL", passAvail: "Y", passNo: "10478174", dob: "1999-03-20", issue: "2017-07-23", expiry: "2027-07-22", address: "MAKAWANPUR", pno: "" },
  { pId: "CPH036", name: "SHAMBU SIJALI", desig: "WAITER", hire: "2017-01-06", loc: "CPH1", nat: "NEPAL", passAvail: "Y", passNo: "PA3218489", dob: "1994-05-09", issue: "2024-08-30", expiry: "2034-08-29", address: "", pno: "5016800531" },
  { pId: "CPH001", name: "LOKENDRA BAHADUR KHAND SHAHI", desig: "COMMIS - 2", hire: "2011-10-23", loc: "CPH1", nat: "NEPAL", passAvail: "Y", passNo: "12150234", dob: "1979-10-01", issue: "2021-03-09", expiry: "2031-03-08", address: "", pno: "" },
  { pId: "CPH054", name: "AKASH TAMANG", desig: "STEWARD", hire: "2025-05-12", loc: "CPH1", nat: "NEPAL", passAvail: "Y", passNo: "PA2568162", dob: "2025-08-23", issue: "2024-03-19", expiry: "2034-03-18", address: "GHYAMPATAR, SUNKOSHI 1, SINDHULI", pno: "20018009937" },
  { pId: "CPH022", name: "MOSARAF HOSSAIN MURSHID ALAM", desig: "COMMIS - 1", hire: "2012-05-05", loc: "CPH1", nat: "Bangladeshi", passAvail: "", passNo: "", dob: "", issue: "", expiry: "", address: "", pno: "" },
  { pId: "CPH055", name: "ANURAG KANDARI", desig: "CONT.CHEF", hire: "2025-05-06", loc: "CPH1", nat: "Indian", passAvail: "", passNo: "", dob: "", issue: "", expiry: "", address: "", pno: "" },
  { pId: "CPH038", name: "SREEJESH PANDHARIKUNNATH", desig: "BAKERY CHEF", hire: "2015-11-11", loc: "CPH1", nat: "Indian", passAvail: "", passNo: "", dob: "", issue: "", expiry: "", address: "", pno: "" },
  { pId: "CPH040", name: "SREEKANTAN PARAMESWARAN PILLAI", desig: "SOUTH CHEF", hire: "2011-10-23", loc: "CPH1", nat: "INDIA", passAvail: "Y", passNo: "AI646818", dob: "1996-05-10", issue: "2025-11-25", expiry: "2035-11-24", address: "CHINNU. BHAWAN, ANNOORKONAM, UZHAMALACKAL, PO PUTHU KULANGARA TRIVANDRUM", pno: "" },
  { pId: "CPH039", name: "SREEKANTHAN KRISHNAN KUTTY", desig: "MAINT.SUPERVISOR", hire: "2011-10-23", loc: "CPH1", nat: "INDIA", passAvail: "Y", passNo: "C9778448", dob: "1975-04-20", issue: "2025-11-07", expiry: "2027-10-27", address: "RADHAMADHAVAM KANJIRAMPARA UZHAMALAKKAL PANACODE P O ARYANAD, TRIVANDRUM PIN:695542,KERLA,INDIA", pno: "" },
  { pId: "CPH050", name: "ASWIN SYAM", desig: "ACCOUNTANT", hire: "2025-02-25", loc: "CPH2", nat: "INDIA", passAvail: "Y", passNo: "U2392021", dob: "2000-12-13", issue: "2021-06-29", expiry: "2031-06-28", address: "PONTHIPARAMBIL HOUSE, MADATHIKARA LANE IRINJALAKUDA PO,THRISSUR PIN: 680121,KERLA,INDIA", pno: "" },
  { pId: "CPH042", name: "NOURA BEN HAMOUDA", desig: "SALES EXECUTIVE", hire: "2022-06-21", loc: "CPH2-OWN", nat: "Tunisian", passAvail: "", passNo: "", dob: "", issue: "", expiry: "", address: "", pno: "" },
  { pId: "CPH003", name: "MADAN KRISHNA BHATTARAI", desig: "HOUSE KEEPING BOY", hire: "2021-11-17", loc: "CPH2", nat: "NEPAL", passAvail: "Y", passNo: "11381152", dob: "2019-01-30", issue: "2019-04-01", expiry: "2029-03-31", address: "SANABADHAHARE,13 TANSEN, PALPA", pno: "" },
  { pId: "CPH006", name: "PADAM PRASAD ADHIKARI", desig: "HOUSE KEEPING BOY", hire: "2021-12-03", loc: "CPH1", nat: "NEPAL", passAvail: "Y", passNo: "PA4031897", dob: "1998-02-25", issue: "2025-03-25", expiry: "2035-03-25", address: "MANAKANAMA TOLE,MECHINGAR 2, JHAPA", pno: "15036" },
  { pId: "CPH045", name: "GIMES KALHARA WARNAKULASURIYA", desig: "HOUSE KEEPING BOY", hire: "2022-10-05", loc: "CPH2", nat: "Sri Lankan", passAvail: "", passNo: "", dob: "", issue: "", expiry: "", address: "", pno: "" },
  { pId: "CPH026", name: "PALASH DEB SUSIL DEB", desig: "HOUSE KEEPING BOY", hire: "2021-12-13", loc: "CPH2", nat: "BANGLADESH", passAvail: "Y", passNo: "A01084153", dob: "1996-08-24", issue: "2021-06-07", expiry: "2031-06-06", address: "JAGADISPUR TEA ESTATE, WORD NO 03 MADHABPUR, ITAKHOLA - 3331, HABIGANJ", pno: "8204962099" },
  { pId: "CPH005", name: "PREMPRAKASH RADHAKRISHAN", desig: "CONT.CHEF", hire: "2021-12-23", loc: "CPH2", nat: "INDIA", passAvail: "Y", passNo: "V2154307", dob: "1990-08-12", issue: "2021-08-12", expiry: "2031-08-11", address: "603,KIRAN APARTEMENT,OPP OLD PETROL PUMP MIRA BHY RD,MIRA RDE, THANE PIN:401107,MAHARASHTRA,INDIA", pno: "" },
  { pId: "CPH028", name: "RAMAN KUMAR MADAN LAL", desig: "HOUSE KEEPING BOY", hire: "2022-01-21", loc: "CPH2", nat: "INDIA", passAvail: "Y", passNo: "S3561151", dob: "1996-01-01", issue: "2018-08-28", expiry: "2028-08-27", address: "VILL BELA JIWANA P/O PARGWAL THE. AKNHOOR,JAMMU PIN: 181207, JAMMU AND KASHMIR,INDIA", pno: "" },
  { pId: "CPH053", name: "MIN KUMAR MUKTAN", desig: "STEWARD", hire: "2025-05-08", loc: "CPH2", nat: "NEPAL", passAvail: "Y", passNo: "PA2432674", dob: "2004-08-11", issue: "2024-02-12", expiry: "2034-02-11", address: "DUMJA,SUNKOSHI 1, SINDHULI", pno: "20017911030" },
  { pId: "CPH058", name: "BHARAT BAL KARAN", desig: "HELPER", hire: "2025-05-19", loc: "GTC MR-UAQ", nat: "INDIA", passAvail: "Y", passNo: "C7260743", dob: "1990-10-10", issue: "2025-03-03", expiry: "2035-03-02", address: "VILL=KUCHDEHARI POST-HARPUR BUDHAT,GORAKHPUR PIN:273209, UTTAR PRADESH, INDIA", pno: "" },
  { pId: "CPH056", name: "DHUPENDRA KUMAR", desig: "HELPER", hire: "2025-05-19", loc: "GTC MR-UAQ", nat: "INDIA", passAvail: "Y", passNo: "Y7876453", dob: "2004-07-13", issue: "2023-08-09", expiry: "2033-08-08", address: "VILL BASTI POST MUNDERA, BLLIA PIN:221712,uttar pradesh,india", pno: "" },
  { pId: "CPH059", name: "SURENDRA PAL", desig: "HELPER", hire: "2025-05-19", loc: "GTC MR-UAQ", nat: "INDIA", passAvail: "Y", passNo: "S4673841", dob: "1973-05-05", issue: "2018-04-22", expiry: "2028-04-21", address: "VILL. UCHAURI POST.SHAEKHANPUR DISTT.GHAZIPUR", pno: "" },
  { pId: "CPH057", name: "SUSHIL PAL", desig: "HELPER", hire: "2025-05-19", loc: "GTC MR-UAQ", nat: "Indian", passAvail: "", passNo: "", dob: "", issue: "", expiry: "", address: "", pno: "" },
  { pId: "CPH060", name: "HEM CHANDRA", desig: "SUPERVISOR", hire: "2025-09-16", loc: "GTC MR-UAQ", nat: "Indian", passAvail: "", passNo: "", dob: "", issue: "", expiry: "", address: "", pno: "" },
  { pId: "CPH061", name: "OMKAR SINGH BHEEM SINGH", desig: "HEAD CHEF", hire: "2025-10-11", loc: "CPH1", nat: "Indian", passAvail: "", passNo: "", dob: "", issue: "", expiry: "", address: "", pno: "" },
  { pId: "CPH062", name: "ELWIN DUMING FERNANDES", desig: "HOUSE KEEPING BOY", hire: "2025-10-16", loc: "CPH1", nat: "INDIA", passAvail: "Y", passNo: "V3219233", dob: "1990-10-09", issue: "2021-10-04", expiry: "2031-10-03", address: "HOUSE NO.148, CHURCHWADA, GHADASAI AT POST HALGA, UTTARA KANNADA PIN: 581328,KARNATAKA,INDIA", pno: "" },
  { pId: "", name: "HAMZA IRSHAD", desig: "MAINTENANCE", hire: "2023-06-21", loc: "CPH1- OWN", nat: "Pakistani", passAvail: "", passNo: "", dob: "", issue: "", expiry: "", address: "", pno: "" },
  { pId: "CPH063", name: "SANJAY KUMAR MALI", desig: "SECURITY", hire: "2025-12-08", loc: "GTC MR-UAQ", nat: "INDIA", passAvail: "Y", passNo: "U4169829", dob: "1993-01-13", issue: "2020-10-23", expiry: "2030-10-22", address: "JHAJPUR GATE SAWAR, AJMER PIN:305407, RAJATHAN,INDIA", pno: "" },
  { pId: "", name: "SHAMSA MOHAMED SALIM BALABD ALKETBI", desig: "HAPPINESS CONSULTANT", hire: "2026-01-28", loc: "ONLINE-EMIRATI", nat: "Emirati", passAvail: "", passNo: "", dob: "", issue: "", expiry: "", address: "", pno: "" },
  { pId: "", name: "NIVEETHA", desig: "HUMAN RESOURCES", hire: "2025-11-18", loc: "CPH1 -OWN", nat: "Indian", passAvail: "", passNo: "", dob: "", issue: "", expiry: "", address: "", pno: "" },
  { pId: "", name: "BETSELOT", desig: "INTERN", hire: "2025-11-03", loc: "CPH1 -OWN", nat: "Ethiopian", passAvail: "", passNo: "", dob: "", issue: "", expiry: "", address: "", pno: "" }
];

async function seed() {
  if(!supabaseUrl) return;

  // Since we also need to update columns in Supabase, we can use the backend Postgres string using Drizzle or direct PG connection.
  // BUT the user may not have provided Postgres credentials over AI Studio.
  // So we will just CREATE tables by updating `supabase_migration.sql` and alert the user to run the migration.
  // Wait! The user says "everything admin insert from here should be added, updated from database also" meaning we should map the backend correctly!
}

seed();
