// LEVELY – každý znak je jedno políčko (32x32 px). Výška levelu je 15 riadkov.
// Generuje tools/vytvor_levely.py (úpravy rob radšej tam).
//   #  zem              B  tehla (rozbije sa)     ?  blok s mincou
//   H  blok so srdiečkom (život navyše)          S  kameň
//   =  drevená plošinka (dá sa na ňu vyskočiť zospodu)
//   o  minca            g  hríb                   k  korytnačka
//   c  sivá mačka       M  kocka na výber mačky (sivá / lietajúca)
//   P  štart hráča      C  kontrolná vlajka       F  cieľová vlajka
window.LEVELY = [
 {
  "nazov": "Lúka",
  "rychlost": 1.0,
  "riadky": [
   "",
   "",
   "",
   "",
   "",
   "                                                           ?H?                                    oooo                     ?",
   "                                                                                                  ====",
   "                                                                            oo",
   "                                      ooooo                                                  oo                         oooooooo                                            SS",
   "               ?   B?B?B     o                            BBBBB   ooo      SSS              ====                 oo     BBB?BBBB               SS     oo          ???      SSS",
   "         ooo                o         =====                               SSSS                                   ==                           SSSS                        SSSS",
   "                             S                                           SSSSS                                                               SSSSSS                      SSSSS",
   "     P                  g   SS    g g        g  g      k                SSSSSS g  C     g g              k  g         g      g    k   g g   SSSSSSSS       k  g k     g SSSSSS        F",
   "##################################################################   ###########################################    ##################################  ################################################",
   "##################################################################   ###########################################    ##################################  ################################################"
  ]
 },
 {
  "nazov": "Mačací kopec",
  "rychlost": 1.15,
  "riadky": [
   "",
   "",
   "",
   "",
   "                                                                                              oooo                                                                    ooo",
   "                    H                                                                         ====                 ?                                                  BBB",
   "                                                ooooo                                                                            oooooo                                                       SS",
   "                                        ooo                                           o                                                                                                      SSS",
   "                                                  g    oooooo         oooo              =====                                                           ooooo                               SSSS",
   "                  ?BBB?                         =====  BB?B?B                         S              ==         BB?BB?BB           SS         o         =====      ?B?          oooo       SSSSS",
   "        oooo                          SS   S                                      S   S                                           SSSS        S                                           SSSSSS",
   "                                     SSS   SS                                 S   S   S                                          SSSSSS                                                  SSSSSSS",
   "    P                     g g     k SSSS   SSS            g  g   k            S g S g S                     C c  g g    k   g g SSSSSSSS              k   k  g g        g g  k          SSSSSSSS  g       F",
   "########################################   ###########################    ##########################    ####################################     ###############################    ###################################",
   "########################################   ###########################    ##########################    ####################################     ###############################    ###################################"
  ]
 },
 {
  "nazov": "Oblaky",
  "rychlost": 1.3,
  "riadky": [
   "",
   "                                                                                                                                                                                                ooooo",
   "                ooooooooooooooo                                           oooooo                                                  ooooooooo                                                                 oooooooo",
   "                                                            ooooooo                                                                                   ooooooo",
   "                                                                                                                                                      =======",
   "                                                   ?                                            oooooo           H                                                                                                           SS",
   "                                    ooooo                                                                                                                                                       =====                       SSS",
   "                                                                                                                                                                          oooooo                                           SSSS",
   "                                                                            g          SS                                                                                                                                 SSSSS",
   "                 ?BBBH             S  S  S      BB?BBB                    ======      SSS        ====          ?????                                  BB?B?BB          SSS   S  S       =====                ======      SSSSSS",
   "                                  SS     SS                    S                     SSSS                                                                             SSSS      SS                                      SSSSSSS",
   "                                 SSS     SS                                         SSSSS                                               SS                           SSSSS      SS                                     SSSSSSSS",
   "    P       M         g  g  k   SSSS     SS   g g   g  k              k k  g g     SSSSSS   g             C   g g   g     M  k      SS        k k  g g      g g   k SSSSSS      SS   g g  g  k        g g             SSSSSSSSS           F",
   "####################################     ###################       #############################      ############################         ###############################      #############################      #######################################",
   "####################################     ###################       #############################      ############################         ###############################      #############################      #######################################"
  ]
 }
];
