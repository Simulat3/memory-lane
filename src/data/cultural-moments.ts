type Category = "key-event" | "memory" | "birthday" | "music" | "movie-tv" | "gaming";

export interface CulturalMoment {
  id: number;
  title: string;
  description: string;
  date: string;
  image: string;
  url: string;
  category: Category;
  preset: true;
}

let nextId = -1;
function moment(date: string, title: string, description: string, category: Category, url = ""): CulturalMoment {
  return { id: nextId--, title, description, date, image: "", url, category, preset: true };
}

export const CULTURAL_MOMENTS: CulturalMoment[] = [
  // ── Key Events ──
  moment("1995-04-19", "Oklahoma City Bombing", "The deadliest domestic terrorist attack in U.S. history shook the nation.", "key-event", "https://en.wikipedia.org/wiki/Oklahoma_City_bombing"),
  moment("1996-07-05", "Dolly the Sheep Born", "The first mammal cloned from an adult cell was born in Scotland.", "key-event", "https://en.wikipedia.org/wiki/Dolly_(sheep)"),
  moment("1997-08-31", "Princess Diana Dies", "The world mourned the death of Princess Diana in a Paris car crash.", "key-event", "https://en.wikipedia.org/wiki/Death_of_Diana,_Princess_of_Wales"),
  moment("1999-12-31", "Y2K New Year's Eve", "The world held its breath as the clock struck midnight — would computers crash?", "key-event", "https://en.wikipedia.org/wiki/Year_2000_problem"),
  moment("2000-11-07", "Bush vs. Gore Election", "The closest U.S. presidential election ended with a Supreme Court decision and hanging chads.", "key-event", "https://en.wikipedia.org/wiki/2000_United_States_presidential_election"),
  moment("2001-09-11", "September 11 Attacks", "The terrorist attacks on the World Trade Center and Pentagon changed the world forever.", "key-event", "https://en.wikipedia.org/wiki/September_11_attacks"),
  moment("2003-02-01", "Space Shuttle Columbia Disaster", "Columbia broke apart during re-entry, killing all seven crew members.", "key-event", "https://en.wikipedia.org/wiki/Space_Shuttle_Columbia_disaster"),
  moment("2004-12-26", "Indian Ocean Tsunami", "A massive earthquake triggered a devastating tsunami across Southeast Asia.", "key-event", "https://en.wikipedia.org/wiki/2004_Indian_Ocean_earthquake_and_tsunami"),
  moment("2005-08-29", "Hurricane Katrina", "One of the deadliest hurricanes in U.S. history devastated New Orleans.", "key-event", "https://en.wikipedia.org/wiki/Hurricane_Katrina"),
  moment("2008-09-15", "Lehman Brothers Collapses", "The largest bankruptcy filing in U.S. history triggered the global financial crisis.", "key-event", "https://en.wikipedia.org/wiki/Bankruptcy_of_Lehman_Brothers"),
  moment("2008-11-04", "Barack Obama Elected President", "The first African American president was elected in a historic landslide.", "key-event", "https://en.wikipedia.org/wiki/2008_United_States_presidential_election"),
  moment("2010-04-20", "Deepwater Horizon Oil Spill", "The largest marine oil spill in history began in the Gulf of Mexico.", "key-event", "https://en.wikipedia.org/wiki/Deepwater_Horizon_oil_spill"),

  // ── Music ──
  moment("1995-08-15", "Alanis Morissette — Jagged Little Pill", "One of the best-selling albums of all time dropped and defined '90s alt-rock.", "music", "https://en.wikipedia.org/wiki/Jagged_Little_Pill"),
  moment("1997-03-25", "The Notorious B.I.G. — Life After Death", "Biggie's iconic double album released just 16 days after his murder.", "music", "https://en.wikipedia.org/wiki/Life_After_Death"),
  moment("1999-01-12", "Britney Spears — ...Baby One More Time", "The debut album that launched Britney into global superstardom.", "music", "https://en.wikipedia.org/wiki/...Baby_One_More_Time_(album)"),
  moment("2000-05-23", "Eminem — The Marshall Mathers LP", "The fastest-selling solo album in U.S. history at the time. Cultural lightning rod.", "music", "https://en.wikipedia.org/wiki/The_Marshall_Mathers_LP"),
  moment("2001-10-23", "Apple iPod Announced", "\"1,000 songs in your pocket\" — the iPod changed how the world listened to music.", "music", "https://en.wikipedia.org/wiki/IPod"),
  moment("2001-11-19", "Linkin Park — Hybrid Theory Goes Diamond", "The nu-metal masterpiece became one of the best-selling debut albums ever.", "music", "https://en.wikipedia.org/wiki/Hybrid_Theory"),
  moment("2003-04-28", "iTunes Store Launches", "Apple's digital music store revolutionized how people bought music.", "music", "https://en.wikipedia.org/wiki/ITunes_Store"),
  moment("2003-06-23", "Beyoncé — Dangerously in Love", "Beyoncé's solo debut featuring \"Crazy in Love\" made her a solo superstar.", "music", "https://en.wikipedia.org/wiki/Dangerously_in_Love"),
  moment("2005-08-01", "Kanye West — Late Registration", "Kanye cemented his genius status with a lush, orchestral sophomore album.", "music", "https://en.wikipedia.org/wiki/Late_Registration"),
  moment("2006-09-10", "Justin Timberlake — FutureSex/LoveSounds", "JT's second solo album redefined pop-R&B with \"SexyBack.\"", "music", "https://en.wikipedia.org/wiki/FutureSex/LoveSounds"),
  moment("2008-11-18", "Lil Wayne — Tha Carter III", "Sold over a million copies in its first week, making Weezy a cultural icon.", "music", "https://en.wikipedia.org/wiki/Tha_Carter_III"),

  // ── Movie / TV ──
  moment("1995-11-22", "Toy Story Released", "The first fully computer-animated feature film changed cinema forever.", "movie-tv", "https://en.wikipedia.org/wiki/Toy_Story"),
  moment("1997-12-19", "Titanic Released", "James Cameron's epic became the highest-grossing film of all time.", "movie-tv", "https://en.wikipedia.org/wiki/Titanic_(1997_film)"),
  moment("1999-03-31", "The Matrix Released", "\"What is the Matrix?\" — a sci-fi masterpiece that redefined action cinema.", "movie-tv", "https://en.wikipedia.org/wiki/The_Matrix"),
  moment("1999-09-22", "The Sopranos Season 1 Finale", "HBO's groundbreaking mob drama that launched the golden age of television.", "movie-tv", "https://en.wikipedia.org/wiki/The_Sopranos"),
  moment("2001-07-11", "Shrek Released", "The irreverent animated comedy became a massive cultural phenomenon.", "movie-tv", "https://en.wikipedia.org/wiki/Shrek"),
  moment("2001-12-19", "Lord of the Rings: Fellowship Released", "Peter Jackson's epic adaptation began the greatest fantasy trilogy in cinema.", "movie-tv", "https://en.wikipedia.org/wiki/The_Lord_of_the_Rings:_The_Fellowship_of_the_Ring"),
  moment("2001-11-16", "Harry Potter: Philosopher's Stone Released", "The beloved book series hit the big screen and became a global phenomenon.", "movie-tv", "https://en.wikipedia.org/wiki/Harry_Potter_and_the_Philosopher%27s_Stone_(film)"),
  moment("2002-05-16", "Spider-Man (2002) Released", "Sam Raimi's superhero film launched the modern comic book movie era.", "movie-tv", "https://en.wikipedia.org/wiki/Spider-Man_(2002_film)"),
  moment("2003-05-29", "Finding Nemo Released", "Pixar's underwater adventure became the highest-grossing animated film at the time.", "movie-tv", "https://en.wikipedia.org/wiki/Finding_Nemo"),
  moment("2004-05-06", "Friends Series Finale", "52 million viewers watched the end of the most beloved sitcom of the era.", "movie-tv", "https://en.wikipedia.org/wiki/The_Last_One_(Friends)"),
  moment("2005-05-19", "Star Wars: Revenge of the Sith", "The final prequel completed Anakin's fall to the dark side.", "movie-tv", "https://en.wikipedia.org/wiki/Star_Wars:_Episode_III_%E2%80%93_Revenge_of_the_Sith"),
  moment("2008-07-18", "The Dark Knight Released", "Heath Ledger's iconic Joker performance redefined the superhero genre.", "movie-tv", "https://en.wikipedia.org/wiki/The_Dark_Knight"),
  moment("2009-12-18", "Avatar Released", "James Cameron's sci-fi epic became the highest-grossing film of all time.", "movie-tv", "https://en.wikipedia.org/wiki/Avatar_(2009_film)"),
  moment("2010-07-16", "Inception Released", "Christopher Nolan's mind-bending thriller became a pop-culture touchstone.", "movie-tv", "https://en.wikipedia.org/wiki/Inception"),

  // ── Gaming ──
  moment("1996-06-23", "Nintendo 64 Launches", "\"It's-a me, Mario!\" — N64 brought 3D gaming to the masses with Super Mario 64.", "gaming", "https://en.wikipedia.org/wiki/Nintendo_64"),
  moment("1998-11-21", "The Legend of Zelda: Ocarina of Time", "Widely considered the greatest video game ever made at the time of release.", "gaming", "https://en.wikipedia.org/wiki/The_Legend_of_Zelda:_Ocarina_of_Time"),
  moment("2000-03-04", "PlayStation 2 Launches", "The best-selling game console of all time hit store shelves.", "gaming", "https://en.wikipedia.org/wiki/PlayStation_2"),
  moment("2000-09-14", "The Sims Released", "Maxis created the life-simulation genre and a cultural juggernaut.", "gaming", "https://en.wikipedia.org/wiki/The_Sims_(video_game)"),
  moment("2001-11-15", "Xbox and Halo Launch", "Microsoft entered the console wars with the original Xbox and Halo: Combat Evolved.", "gaming", "https://en.wikipedia.org/wiki/Halo:_Combat_Evolved"),
  moment("2002-10-29", "Grand Theft Auto: Vice City", "Rockstar's neon-soaked open world became one of the defining games of the PS2 era.", "gaming", "https://en.wikipedia.org/wiki/Grand_Theft_Auto:_Vice_City"),
  moment("2004-11-23", "World of Warcraft Launches", "Blizzard's MMORPG became a global phenomenon with millions of subscribers.", "gaming", "https://en.wikipedia.org/wiki/World_of_Warcraft"),
  moment("2006-11-19", "Nintendo Wii Launches", "Motion controls brought gaming to a whole new audience.", "gaming", "https://en.wikipedia.org/wiki/Wii"),
  moment("2007-11-20", "Call of Duty 4: Modern Warfare", "The game that redefined online multiplayer shooters for a generation.", "gaming", "https://en.wikipedia.org/wiki/Call_of_Duty_4:_Modern_Warfare"),
  moment("2008-04-29", "Grand Theft Auto IV Released", "Rockstar's sprawling open world set a new standard for sandbox gaming.", "gaming", "https://en.wikipedia.org/wiki/Grand_Theft_Auto_IV"),
  moment("2010-09-17", "Minecraft Public Release", "Notch's indie sandbox became one of the best-selling games in history.", "gaming", "https://en.wikipedia.org/wiki/Minecraft"),
];
