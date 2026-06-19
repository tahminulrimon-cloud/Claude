require("dotenv").config();
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const db = require("./db");

const gdrive = (id) => `https://drive.google.com/thumbnail?id=${id}&sz=w800`;

const ENTRIES = [
  { label: "Birth Day", age: "Day 0", date: "25 April 2022", photo: gdrive("1xJUA_bpR-WKPsUGkRrNpuebfqcW_oawl"), caption: "Welcome to the world, little Alysha! 🌸", milestone: "First breath of life", ageInDays: 0 },
  { label: "Day 2", age: "Day 2", date: "27 April 2022", photo: gdrive("1c7w32VRHMeUSHQrLVE4qA7RQKrIoilSx"), caption: "Every tiny moment is a treasure", milestone: "Hospital days", ageInDays: 2 },
  { label: "Day 5", age: "Day 5", date: "30 April 2022", photo: gdrive("1hNeJ__WMiMseGTLGYyU3eShIm0EraGc2"), caption: "Every tiny moment is a treasure", milestone: "Hospital days", ageInDays: 5 },
  { label: "Day 10", age: "Day 10", date: "5 May 2022", photo: gdrive("1CAUbaLjqnzleU9TTaDnzsyYbH8-a13fX"), caption: "Learning what this beautiful world is all about", milestone: "First week home", ageInDays: 10 },
  { label: "3 Wks", age: "3 weeks", date: "13 May 2022", photo: gdrive("1wp7d6llb-djdyQUi7R_VKEKxbzwrEvnL"), caption: "Learning what this beautiful world is all about", milestone: "Newborn wonder", ageInDays: 18 },
  { label: "4 Wks", age: "4 weeks", date: "23 May 2022", photo: gdrive("1ut_4h0u2e5br64XaEs-LWN_rDY8gT1Yd"), caption: "Learning what this beautiful world is all about", milestone: "Newborn wonder", ageInDays: 28 },
  { label: "1 Mo", age: "~1 months", date: "4 June 2022", photo: gdrive("1y52hNTE0OEVxP9a6n1IyuarjLZSnDkjv"), caption: "That smile makes every heart melt 💕", milestone: "Social smiling", ageInDays: 40 },
  { label: "2 Mo", age: "~2 months", date: "10 June 2022", photo: gdrive("1_iSlugaucz7RnTwZqXMk04rWmC8W29oT"), caption: "That smile makes every heart melt 💕", milestone: "Social smiling", ageInDays: 46 },
  { label: "2 Mo", age: "~2 months", date: "19 June 2022", photo: gdrive("1pNyqVWkiYO3lZb5BpsMVW3_IT0G-3Mi2"), caption: "That smile makes every heart melt 💕", milestone: "Social smiling", ageInDays: 55 },
  { label: "2 Mo", age: "~2 months", date: "29 June 2022", photo: gdrive("1PPGCLhFdLrmaJQ9jL1TG-hJGoXKJ62vU"), caption: "Growing stronger and more beautiful every day", milestone: "Cooing & tracking", ageInDays: 65 },
  { label: "2 Mo", age: "~2 months", date: "2 July 2022", photo: gdrive("10SLGZK_m3PPgC1cEnHmYdvC0nfjCFCUF"), caption: "Growing stronger and more beautiful every day", milestone: "Cooing & tracking", ageInDays: 68 },
  { label: "2 Mo", age: "~2 months", date: "2 July 2022", photo: gdrive("1E2Z13565nAf726wo4JfzBm0TBS6Djuey"), caption: "Growing stronger and more beautiful every day", milestone: "Cooing & tracking", ageInDays: 68 },
  { label: "2 Mo", age: "~2 months", date: "6 July 2022", photo: gdrive("1kMmILdAZiD460JFc1lKQGQvfQ8LsKrYG"), caption: "Growing stronger and more beautiful every day", milestone: "Cooing & tracking", ageInDays: 72 },
  { label: "2 Mo", age: "~2 months", date: "8 July 2022", photo: gdrive("1gteJUmDXwYZzLqL9LApYwZ8a0TAkigOz"), caption: "Growing stronger and more beautiful every day", milestone: "Cooing & tracking", ageInDays: 74 },
  { label: "3 Mo", age: "~3 months", date: "22 July 2022", photo: gdrive("1Q3o1QatoUFHZC7n3e1uUKiQz-f7-tfA9"), caption: "Growing stronger and more beautiful every day", milestone: "Cooing & tracking", ageInDays: 88 },
  { label: "3 Mo", age: "~3 months", date: "22 July 2022", photo: gdrive("1PRE0DTP9J1SZ8VMpjVrNW_t82sMP6M0m"), caption: "Growing stronger and more beautiful every day", milestone: "Cooing & tracking", ageInDays: 88 },
  { label: "3 Mo", age: "~3 months", date: "29 July 2022", photo: gdrive("1S0LPKgg5CrC36iGmrHn6oB6rN-7oEFAK"), caption: "Curious eyes discovering everything around her", milestone: "Head control", ageInDays: 95 },
  { label: "4 Mo", age: "~4 months", date: "18 August 2022", photo: gdrive("1UR5vc9OxBdYk7rbOWXiA6JJL3CNeKedP"), caption: "Curious eyes discovering everything around her", milestone: "Head control", ageInDays: 115 },
  { label: "5 Mo", age: "~5 months", date: "12 September 2022", photo: gdrive("1dWg1OFh90koge6OkWCzqlFYL6fkSc_1K"), caption: "Curious eyes discovering everything around her", milestone: "Reaching & grasping", ageInDays: 140 },
  { label: "6 Mo", age: "~6 months", date: "7 October 2022", photo: gdrive("11ZLGZ7xrai9uwaTFt08y7cYeSM2r4NA-"), caption: "Curious eyes discovering everything around her", milestone: "Reaching & grasping", ageInDays: 165 },
  { label: "6 Mo", age: "~6 months", date: "1 November 2022", photo: gdrive("1pbThEjV6jycSZpcUdjVnSWjn8N1URlKc"), caption: "Exploring and discovering her world", milestone: "Sitting up", ageInDays: 190 },
  { label: "7 Mo", age: "~7 months", date: "1 December 2022", photo: gdrive("1r0CqwsWj1u8luRmR-oNIfsZ2XsxBuL_X"), caption: "Exploring and discovering her world", milestone: "Sitting up", ageInDays: 220 },
  { label: "1y 6m", age: "1 yr 6 mo", date: "23 October 2023", photo: gdrive("1pRMetaF4H9BD2cY-AxMtmlkFsat9Z6zq"), caption: "Toddler adventures begin!", milestone: "First steps!", ageInDays: 546 },
  { label: "2yr", age: "2 years", date: "5 May 2024", photo: gdrive("11gnmLbDrNJiNlYCzpIxrkw9Z0aHIUR9Z"), caption: "Running everywhere and talking non-stop", milestone: "Running & talking", ageInDays: 741 },
  { label: "2yr", age: "2 years", date: "6 May 2024", photo: gdrive("1kkoXda1XSDbr26wq3measgNvlVIFP2XT"), caption: "Running everywhere and talking non-stop", milestone: "Running & talking", ageInDays: 742 },
  { label: "2yr", age: "2 years", date: "15 May 2024", photo: gdrive("1txcWXFZnqbBtrvVU3fOndYT-M3k9iANh"), caption: "Running everywhere and talking non-stop", milestone: "Running & talking", ageInDays: 751 },
  { label: "2y 1m", age: "2 yr 1 mo", date: "4 June 2024", photo: gdrive("1jMXl7v52dJP8cgxM9JiPV2SXdUPSMXxP"), caption: "Running everywhere and talking non-stop", milestone: "Running & talking", ageInDays: 771 },
  { label: "2y 1m", age: "2 yr 1 mo", date: "5 June 2024", photo: gdrive("1flkpLiqP6miZjzW0SFCj5T-MT6AJOBzf"), caption: "Running everywhere and talking non-stop", milestone: "Running & talking", ageInDays: 772 },
  { label: "2y 2m", age: "2 yr 2 mo", date: "23 June 2024", photo: gdrive("1EFVeCrgEV43CyMcWvrtjlzjNNrW6XpN2"), caption: "Running everywhere and talking non-stop", milestone: "Running & talking", ageInDays: 790 },
  { label: "2y 2m", age: "2 yr 2 mo", date: "29 June 2024", photo: gdrive("1xJyFpmAVFPaV4_Fl1TOOwu3aZLb6fu96"), caption: "Running everywhere and talking non-stop", milestone: "Running & talking", ageInDays: 796 },
  { label: "2y 2m", age: "2 yr 2 mo", date: "30 June 2024", photo: gdrive("1aWFpqQVBdPDxkoe1qDdTzk_OPF6EfgZP"), caption: "Running everywhere and talking non-stop", milestone: "Running & talking", ageInDays: 797 },
  { label: "2y 2m", age: "2 yr 2 mo", date: "18 July 2024", photo: gdrive("15OZ7Ej5FF9oHgt6_fWKJxiqc2swLM16a"), caption: "Running everywhere and talking non-stop", milestone: "Running & talking", ageInDays: 815 },
  { label: "2y 2m", age: "2 yr 2 mo", date: "22 July 2024", photo: gdrive("1GtkQBSfE3jt0oSBpUM1VpWck-5Cqe9y5"), caption: "Running everywhere and talking non-stop", milestone: "Running & talking", ageInDays: 819 },
  { label: "2y 2m", age: "2 yr 2 mo", date: "22 July 2024", photo: gdrive("1aWUXNn3ybm3TpMQMc0k5OJILpsw8wglW"), caption: "Running everywhere and talking non-stop", milestone: "Running & talking", ageInDays: 819 },
  { label: "2y 2m", age: "2 yr 2 mo", date: "22 July 2024", photo: gdrive("1pmOQE_MgERlqDxoIdwXAkdQyOztIfLyM"), caption: "Running everywhere and talking non-stop", milestone: "Running & talking", ageInDays: 819 },
  { label: "2y 3m", age: "2 yr 3 mo", date: "25 July 2024", photo: gdrive("1WWmOeDNeUndZWjRFxKfj6PnDSjvWEts6"), caption: "Running everywhere and talking non-stop", milestone: "Running & talking", ageInDays: 822 },
  { label: "2y 3m", age: "2 yr 3 mo", date: "29 July 2024", photo: gdrive("1ZlligfkR7BswC3WvSe1P85NsA_TdPRCZ"), caption: "Running everywhere and talking non-stop", milestone: "Running & talking", ageInDays: 826 },
  { label: "2y 3m", age: "2 yr 3 mo", date: "10 August 2024", photo: gdrive("1YVBJh4IphDO4in8RgpbjvBM4hCpaXygS"), caption: "Running everywhere and talking non-stop", milestone: "Running & talking", ageInDays: 838 },
  { label: "2y 3m", age: "2 yr 3 mo", date: "13 August 2024", photo: gdrive("15pQoWwX3hH0RWsy9oCBs95s5tuBHNJ8B"), caption: "Running everywhere and talking non-stop", milestone: "Running & talking", ageInDays: 841 },
  { label: "2y 3m", age: "2 yr 3 mo", date: "14 August 2024", photo: gdrive("1yMEwwywyWy1r8cjTHOMkuQF-i4EodA7y"), caption: "Running everywhere and talking non-stop", milestone: "Running & talking", ageInDays: 842 },
  { label: "2y 3m", age: "2 yr 3 mo", date: "17 August 2024", photo: gdrive("1Fa4uZh65dy1U9kRPxC4DYXqIBbiA76u9"), caption: "Running everywhere and talking non-stop", milestone: "Running & talking", ageInDays: 845 },
  { label: "2y 4m", age: "2 yr 4 mo", date: "28 August 2024", photo: gdrive("189qoTwE-nx-gFmCre3AIdSPM2rGIQX8n"), caption: "Running everywhere and talking non-stop", milestone: "Running & talking", ageInDays: 856 },
  { label: "2y 4m", age: "2 yr 4 mo", date: "8 September 2024", photo: gdrive("1OnX-RHYVuucq2iizUJinmqaujgYxsVlE"), caption: "Running everywhere and talking non-stop", milestone: "Running & talking", ageInDays: 867 },
  { label: "2y 4m", age: "2 yr 4 mo", date: "9 September 2024", photo: gdrive("1FOSbFa3uAjKTojwn1nvIAdt_6vj6xLw2"), caption: "Running everywhere and talking non-stop", milestone: "Running & talking", ageInDays: 868 },
  { label: "2y 4m", age: "2 yr 4 mo", date: "17 September 2024", photo: gdrive("1GfpCBWDGlYFn8g2IQ6Hlj--4bpAHr1QJ"), caption: "Running everywhere and talking non-stop", milestone: "Running & talking", ageInDays: 876 },
  { label: "2y 4m", age: "2 yr 4 mo", date: "18 September 2024", photo: gdrive("1y6QGtcznKeuz67DToJEsgoIKydaDVkBO"), caption: "Running everywhere and talking non-stop", milestone: "Running & talking", ageInDays: 877 },
  { label: "2y 4m", age: "2 yr 4 mo", date: "19 September 2024", photo: gdrive("1KVurB5EKK0FaWZ1q2EiEz4QzcJV64-2s"), caption: "Running everywhere and talking non-stop", milestone: "Running & talking", ageInDays: 878 },
  { label: "2y 5m", age: "2 yr 5 mo", date: "23 September 2024", photo: gdrive("14mjuPFeTqGThRDddiWASh_LH7H7g4JEo"), caption: "Running everywhere and talking non-stop", milestone: "Running & talking", ageInDays: 882 },
  { label: "2y 5m", age: "2 yr 5 mo", date: "15 October 2024", photo: gdrive("1Pipi2MdxJDp3a52qvE07z08jWEzfbdaP"), caption: "Running everywhere and talking non-stop", milestone: "Running & talking", ageInDays: 904 },
  { label: "2y 7m", age: "2 yr 7 mo", date: "18 December 2024", photo: gdrive("1FRjrTsW6sGTS27dXMnqx9_bE4ExO26J8"), caption: "Every day a new discovery and a new wonder", milestone: "Imagination blooms", ageInDays: 968 },
  { label: "2y 8m", age: "2 yr 8 mo", date: "26 December 2024", photo: gdrive("1fEf87Qhn141cuPXkmk1zHyBsnTusCX9e"), caption: "Every day a new discovery and a new wonder", milestone: "Imagination blooms", ageInDays: 976 },
  { label: "2y 8m", age: "2 yr 8 mo", date: "12 January 2025", photo: gdrive("17siizyrYh1f20SLV00hLDJmjjSjwTlW_"), caption: "Every day a new discovery and a new wonder", milestone: "Imagination blooms", ageInDays: 993 },
  { label: "2y 10m", age: "2 yr 10 mo", date: "22 February 2025", photo: gdrive("1LmlX5TpGV6jsIPu7PTa_t2o6FQsx5-lf"), caption: "Every day a new discovery and a new wonder", milestone: "Imagination blooms", ageInDays: 1034 },
  { label: "2y 11m", age: "2 yr 11 mo", date: "2 April 2025", photo: gdrive("1aKBGl0c4sXpl1Xu-umxxbeZorWtjNSbQ"), caption: "Every day a new discovery and a new wonder", milestone: "Imagination blooms", ageInDays: 1073 },
  { label: "2y 12m", age: "2 yr 12 mo", date: "22 April 2025", photo: gdrive("13Jv-aX0TW0CP89lz_HTFHgQ5nXioAjYZ"), caption: "Every day a new discovery and a new wonder", milestone: "Imagination blooms", ageInDays: 1093 },
  { label: "2y 12m", age: "2 yr 12 mo", date: "22 April 2025", photo: gdrive("1mJPiUtbZ9R7GR19-VUIIeBbjQm4br1R0"), caption: "Every day a new discovery and a new wonder", milestone: "Imagination blooms", ageInDays: 1093 },
  { label: "2y 12m", age: "2 yr 12 mo", date: "23 April 2025", photo: gdrive("1FLK95EVJ9ZVZjhQQS8Q5UDGMQHfIAe6w"), caption: "Every day a new discovery and a new wonder", milestone: "Imagination blooms", ageInDays: 1094 },
  { label: "3yr", age: "3 years", date: "26 April 2025", photo: gdrive("1q0Qqvu-ykOiQ6QADs6DA64OxKPK84WuX"), caption: "Mama and baba's biggest pride and joy", milestone: "Preschool days", ageInDays: 1097 },
  { label: "3yr", age: "3 years", date: "26 April 2025", photo: gdrive("1Wm3uXhM3JYK75UavnwoKZdeiWfNXpDfg"), caption: "Mama and baba's biggest pride and joy", milestone: "Preschool days", ageInDays: 1097 },
  { label: "3yr", age: "3 years", date: "28 April 2025", photo: gdrive("1tBaigPg0i8v1Q3JeENWgkZVMn52I5uao"), caption: "Mama and baba's biggest pride and joy", milestone: "Preschool days", ageInDays: 1099 },
  { label: "3yr", age: "3 years", date: "28 April 2025", photo: gdrive("14GrvThuvejy1KVMp7HrBsuX4xmItj0eR"), caption: "Mama and baba's biggest pride and joy", milestone: "Preschool days", ageInDays: 1099 },
  { label: "3yr", age: "3 years", date: "29 April 2025", photo: gdrive("1aB7bS-WmlrRKsY37W3kGD6JwzvpzUeRA"), caption: "Mama and baba's biggest pride and joy", milestone: "Preschool days", ageInDays: 1100 },
  { label: "3y 1m", age: "3 yr 1 mo", date: "11 June 2025", photo: gdrive("1lWZHplR0lMmDy1qA3zrxuFvqqQKw-OHk"), caption: "Mama and baba's biggest pride and joy", milestone: "Preschool days", ageInDays: 1143 },
  { label: "3y 1m", age: "3 yr 1 mo", date: "16 June 2025", photo: gdrive("176IQVbmG6waeF28jjPtdKvBqjupRY8j7"), caption: "Mama and baba's biggest pride and joy", milestone: "Preschool days", ageInDays: 1148 },
  { label: "3y 3m", age: "3 yr 3 mo", date: "2 August 2025", photo: gdrive("1q9ynulYeMGbUftQWuLR7_5tpd_ch7ohH"), caption: "Mama and baba's biggest pride and joy", milestone: "Preschool days", ageInDays: 1195 },
  { label: "3y 3m", age: "3 yr 3 mo", date: "11 August 2025", photo: gdrive("1QJYXzkLpajhvcsmoT0vLyI9bzBmQQJ-e"), caption: "Mama and baba's biggest pride and joy", milestone: "Preschool days", ageInDays: 1204 },
  { label: "3y 3m", age: "3 yr 3 mo", date: "18 August 2025", photo: gdrive("19DmRtb01XrJ842AaajtDyf8vLvQwJ9d8"), caption: "Mama and baba's biggest pride and joy", milestone: "Preschool days", ageInDays: 1211 },
  { label: "3y 3m", age: "3 yr 3 mo", date: "19 August 2025", photo: gdrive("1QPyP2rppe2Fb-SCUCQgWoV3ODGaSxLHE"), caption: "Mama and baba's biggest pride and joy", milestone: "Preschool days", ageInDays: 1212 },
  { label: "3y 4m", age: "3 yr 4 mo", date: "11 September 2025", photo: gdrive("1afVFPtUSotdVgs86rzZ1G_HIN5ghUsBM"), caption: "Mama and baba's biggest pride and joy", milestone: "Preschool days", ageInDays: 1235 },
  { label: "3y 5m", age: "3 yr 5 mo", date: "21 September 2025", photo: gdrive("1B2_9inucE4JmSyjWH3Sx8_bwM4kw6zWZ"), caption: "Mama and baba's biggest pride and joy", milestone: "Preschool days", ageInDays: 1245 },
  { label: "3y 5m", age: "3 yr 5 mo", date: "22 September 2025", photo: gdrive("1ycG4N0EgIcABmoQ8aOPNDBnTLQmFbz3x"), caption: "Mama and baba's biggest pride and joy", milestone: "Preschool days", ageInDays: 1246 },
  { label: "3y 5m", age: "3 yr 5 mo", date: "27 September 2025", photo: gdrive("118_KUXCj-h2hsajWbB7ye6dGbocmNuMy"), caption: "Mama and baba's biggest pride and joy", milestone: "Preschool days", ageInDays: 1251 },
  { label: "3y 5m", age: "3 yr 5 mo", date: "9 October 2025", photo: gdrive("1yScgm8V8OzKfT_ml77izYVDvsnZV1H6e"), caption: "Mama and baba's biggest pride and joy", milestone: "Preschool days", ageInDays: 1263 },
  { label: "3y 6m", age: "3 yr 6 mo", date: "1 November 2025", photo: gdrive("1gTU896cUT73yWUoGxdqbsjwVT65kc7vC"), caption: "Getting bigger, brighter, and more beautiful every day", milestone: "Growing up fast", ageInDays: 1286 },
  { label: "3y 6m", age: "3 yr 6 mo", date: "18 November 2025", photo: gdrive("1PD39IKjHvd831KPEeuM_P3Dg4PUDdgVP"), caption: "Getting bigger, brighter, and more beautiful every day", milestone: "Growing up fast", ageInDays: 1303 },
  { label: "3y 7m", age: "3 yr 7 mo", date: "23 November 2025", photo: gdrive("1AJkSjx4NKObc-uNr1hGFKy15RpDV3-3U"), caption: "Getting bigger, brighter, and more beautiful every day", milestone: "Growing up fast", ageInDays: 1308 },
  { label: "3y 8m", age: "3 yr 8 mo", date: "30 December 2025", photo: gdrive("1iPazcAGo3h4I-4y7t3PBAd-nrh8nu05o"), caption: "Getting bigger, brighter, and more beautiful every day", milestone: "Growing up fast", ageInDays: 1345 },
  { label: "3y 8m", age: "3 yr 8 mo", date: "3 January 2026", photo: gdrive("1CBJzb6HwgOAeQfVWpNinxfuribzfELeV"), caption: "Getting bigger, brighter, and more beautiful every day", milestone: "Growing up fast", ageInDays: 1349 },
  { label: "3y 8m", age: "3 yr 8 mo", date: "3 January 2026", photo: gdrive("11Y_SN0sVjrDHdr-6kZIzWzIla6SMh_0S"), caption: "Getting bigger, brighter, and more beautiful every day", milestone: "Growing up fast", ageInDays: 1349 },
  { label: "3y 8m", age: "3 yr 8 mo", date: "8 January 2026", photo: gdrive("1HcoP-ezlvUBPT8fsltZSEr5YJJuibgt0"), caption: "Getting bigger, brighter, and more beautiful every day", milestone: "Growing up fast", ageInDays: 1354 },
  { label: "3y 8m", age: "3 yr 8 mo", date: "10 January 2026", photo: gdrive("1k4hV35KesB5o4NsIstGQuMzFk-Ui5BzM"), caption: "Getting bigger, brighter, and more beautiful every day", milestone: "Growing up fast", ageInDays: 1356 },
  { label: "3y 8m", age: "3 yr 8 mo", date: "10 January 2026", photo: gdrive("1XYGo8a2pRVkel5yi6KPzntrj6po3t1ZU"), caption: "Getting bigger, brighter, and more beautiful every day", milestone: "Growing up fast", ageInDays: 1356 },
  { label: "3y 9m", age: "3 yr 9 mo", date: "4 February 2026", photo: gdrive("1nte2KiwRTofttFj_jSPhBuTHwf1BjIBY"), caption: "Getting bigger, brighter, and more beautiful every day", milestone: "Growing up fast", ageInDays: 1381 },
  { label: "3y 10m", age: "3 yr 10 mo", date: "13 March 2026", photo: gdrive("1UxLvUdt5pPMuJpx6Zc8Lta5z180byiOr"), caption: "Getting bigger, brighter, and more beautiful every day", milestone: "Growing up fast", ageInDays: 1418 },
  { label: "4y 1m", age: "4 yr 1 mo", date: "8 June 2026", photo: gdrive("1IDOUz9k-zdhmQrwJAZIZLuElVYyi"), caption: "Getting bigger, brighter, and more beautiful every day", milestone: "Growing up fast", ageInDays: 1505 },
  { label: "4y 1m", age: "4 yr 1 mo", date: "11 June 2026", photo: gdrive("1P3QiEmpilafVWIRCkatuTkpfeqSn_6WV"), caption: "Getting bigger, brighter, and more beautiful every day", milestone: "Growing up fast", ageInDays: 1508 },
  { label: "4y 1m", age: "4 yr 1 mo", date: "13 June 2026", photo: gdrive("1emVucLUM1ibM3TPKsv1PTHHvUHEPzq6W"), caption: "Getting bigger, brighter, and more beautiful every day", milestone: "Growing up fast", ageInDays: 1510 },
  { label: "4y 1m", age: "4 yr 1 mo", date: "13 June 2026", photo: gdrive("1KBCrE34Gy2k6ZV0N20S1EioDBE9uk4Bs"), caption: "Getting bigger, brighter, and more beautiful every day", milestone: "Growing up fast", ageInDays: 1510 },
  { label: "4y 1m", age: "4 yr 1 mo", date: "14 June 2026", photo: gdrive("194S1y8FcqTDmnSvfv0e4TdlJuWt0sgdP"), caption: "Getting bigger, brighter, and more beautiful every day", milestone: "Growing up fast", ageInDays: 1511 },
  { label: "4y 1m", age: "4 yr 1 mo", date: "21 June 2026", photo: gdrive("1jxhClo1TvywQeA6T3mYgPypIuhBKVpxU"), caption: "Getting bigger, brighter, and more beautiful every day", milestone: "Growing up fast", ageInDays: 1518 },
];

function seed() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@alysha.family";
  const adminPassword = process.env.ADMIN_PASSWORD || "Alysha@2022";
  const existingAdmin = db.prepare("SELECT id FROM users WHERE email = ?").get(adminEmail);

  if (!existingAdmin) {
    const hash = bcrypt.hashSync(adminPassword, 12);
    db.prepare("INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)").run(
      uuidv4(), adminEmail, hash, "admin"
    );
    console.log(`✓ Admin user created: ${adminEmail}`);
  } else {
    console.log(`  Admin user already exists: ${adminEmail}`);
  }

  const count = db.prepare("SELECT COUNT(*) as n FROM entries").get().n;
  if (count > 0 && count !== ENTRIES.length) {
    // Re-seed when entry count has changed
    db.prepare("DELETE FROM entries").run();
    console.log(`  Cleared ${count} old entries — re-seeding with ${ENTRIES.length}`);
  } else if (count === ENTRIES.length) {
    console.log(`  Entries already seeded (${count} rows)`);
    return;
  }

  const insertEntry = db.prepare(
    `INSERT INTO entries (id, label, age, date, photo, caption, milestone, age_in_days, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertAll = db.transaction((entries) => {
    entries.forEach((e, i) => {
      insertEntry.run(uuidv4(), e.label, e.age, e.date, e.photo, e.caption, e.milestone, e.ageInDays, i);
    });
  });
  insertAll(ENTRIES);
  console.log(`✓ Seeded ${ENTRIES.length} timeline entries`);
}

seed();
console.log("✓ Database ready");
