// LEVEL 1 – každý znak je jedno políčko (32x32 px). Výška levelu je 15 riadkov.
//   #  zem              B  tehla (rozbije sa)     ?  blok s mincou
//   H  blok so srdiečkom (život navyše)          S  kameň
//   =  drevená plošinka (dá sa na ňu vyskočiť zospodu)
//   o  minca            g  hríb                   k  korytnačka
//   M  kocka na výber mačky (sivá / lietajúca)  P  štart hráča            C  kontrolná vlajka
//   F  cieľová vlajka (stojí na zemi)
// Riadky môžu byť rôzne dlhé, chýbajúce miesta sú prázdne.
window.LEVEL1 = [
  "                                                                                                                                                                                                        ",
  "                                                                                                                                                                                                        ",
  "                                                                                                                                                                                                        ",
  "                                                                                                                                                                                                        ",
  "                                                                                                                                                                                                        ",
  "                                                           ?H?                                    oooo                     ?                                                                            ",
  "                                                                                                  ====                                                                                                  ",
  "                                                                            oo                                                                                                                          ",
  "                                      ooooo                                                  oo                         oooooooo                                            SS                          ",
  "               ?   B?B?B     o                            BBBBB   ooo      SSS              ====                 oo     BBB?BBBB               SS     oo          ???      SSS                          ",
  "         ooo                o         =====                               SSSS                                   ==                           SSSS                        SSSS                          ",
  "                             S                                           SSSSS                                                               SSSSSS                      SSSSS                          ",
  "     P                  g   SS    M          g  g      k                SSSSSS    C     g g              k  g                g    k   g g   SSSSSSSS          g k       SSSSSS        F                 ",
  "##################################################################   ###########################################    ##################################  ################################################",
  "##################################################################   ###########################################    ##################################  ################################################"
];
