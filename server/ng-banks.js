

module.exports = [
  {
    "name": "ACCESS BANK PLC",
    "code": "044",
    "slug": "ACC",
    "ussd": {
      "code": "*901#"
    }
  },
  {
    "name": "CITIBANK NIGERIA PLC",
    "code": "023",
    "slug": "CBN",
    "ussd": {
      "code": null
    }
  },
  {
    "name": "ACCESS(DIAMOND) BANK PLC",
    "code": "063",
    "slug": "DMB",
    "ussd": {
      "code": "*710#"
    }
  },
  {
    "name": "ECOBANK NIGERIA PLC",
    "code": "050",
    "slug": "EBN",
    "ussd": {
      "code": "*326#"
    }
  },
  {
    "name": "FIDELITY BANK PLC",
    "code": "070",
    "slug": "FDB",
    "ussd": {
      "code": "*770#"
    }
  },
  {
    "name": "FIRST BANK NIGERIA LIMITED",
    "code": "011",
    "slug": "FBN",
    "ussd": {
      "code": "*894#"
    }
  },
  {
    "name": "FIRST CITY MONUMENT BANK PLC",
    "code": "214",
    "slug": "FCB",
    "ussd": {
      "code": "*329#"
    }
  },
  {
    "name": "GLOBUS BANK LTD",
    "code": null,
    "slug": "GLB",
    "ussd": {
      "code": null
    }
  },
  {
    "name": "GUARANTY TRUST BANK PLC",
    "code": "058",
    "slug": "GTB",
    "ussd": {
      "code": "*737#"
    }
  },
  {
    "name": "HERITAGE BANK PLC",
    "code": "030",
    "slug": "HTB",
    "ussd": {
      "code": "*322#"
    }
  },
  {
    "name": "KEY STONE BANK",
    "code": "082",
    "slug": "KSB",
    "ussd": {
      "code": "*7111#"
    }
  },
  {
    "name": "POLARIS BANK LIMITED",
    "code": "076",
    "slug": "PLB",
    "ussd": {
      "code": null
    }
  },
  {
    "name": "PROVIDUS BANK LIMITED",
    "code": "101",
    "slug": "PVB",
    "ussd": {
      "code": null
    }
  },
  {
    "name": "STANBIC IBTC BANK LTD",
    "code": "221",
    "slug": "SIB",
    "ussd": {
      "code": "*909#"
    }
  },
  {
    "name": "STANDARD CHARTERED BANK NIGERIA LTD",
    "code": "068",
    "slug": "SCB",
    "ussd": {
      "code": null
    }
  },
  {
    "name": "STERLING BANK PLC",
    "code": "232",
    "slug": "STB",
    "ussd": {
      "code": "*822#"
    }
  },
  {
    "name": "SUNTRUST BANK NIGERIA LTD",
    "code": "100",
    "slug": "SBN",
    "ussd": {
      "code": null
    }
  },
  {
    "name": "TITAN TRUST BANK LTD",
    "code": null,
    "slug": "TTB",
    "ussd": {
      "code": null
    }
  },
  {
    "name": "UNION BANK OF NIGERIA PLC",
    "code": "032",
    "slug": "UBN",
    "ussd": {
      "code": "*826#"
    }
  },
  {
    "name": "UNITED BANK FOR AFRICA PLC",
    "code": "033",
    "slug": "UBA",
    "ussd": {
      "code": "*919#"
    }
  },
  {
    "name": "UNITY BANK PLC",
    "code": "215",
    "slug": "UNB",
    "ussd": {
      "code": "*7799#"
    }
  },
  {
    "name": "WEMA BANK PLC",
    "code": "035",
    "slug": "WEM",
    "ussd": {
      "code": "*945#"
    }
  },
  {
    "name": "ZENITH BANK PLC",
    "code": "057",
    "slug": "ZIB",
    "ussd": {
      "code": "*966#"
    }
  }
].sort((a,b)=>{
  if(a.name < b.name) return -1
  return 1
})

