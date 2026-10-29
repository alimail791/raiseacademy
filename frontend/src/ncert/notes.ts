// NCERT chapter notes for NEET (www.yneet.in/ncert-notes/<slug>).
// Written from the NCERT Biology textbooks (Class 11 and 12, rationalised edition),
// kept short: the points NEET asks most, one comparison table, and common traps.
// Every fact here should be checkable against the NCERT text. Edit with care.

export type NcertNote = {
  slug: string;
  chapter: string;
  cls: 11 | 12;
  subject: "Biology";
  intro: string;
  sections: { heading: string; points: string[] }[];
  table?: { title: string; head: string[]; rows: string[][] };
  traps: string[];
};

export const NCERT_NOTES: NcertNote[] = [
  {
    slug: "cell-the-unit-of-life",
    chapter: "Cell: The Unit of Life",
    cls: 11,
    subject: "Biology",
    intro: "The structure of prokaryotic and eukaryotic cells and what each organelle does. Almost every NEET paper has 2–3 questions from this chapter, mostly on organelles and ribosomes.",
    sections: [
      {
        heading: "Cell theory",
        points: [
          "Anton von Leeuwenhoek first saw and described a live cell. Robert Brown later discovered the nucleus.",
          "Schleiden (1838, plants) and Schwann (1839, animals) proposed that all living organisms are made of cells.",
          "Rudolf Virchow (1855) added that new cells arise from pre-existing cells: Omnis cellula-e cellula. This completed the cell theory.",
        ],
      },
      {
        heading: "Prokaryotic cells",
        points: [
          "No membrane-bound nucleus or organelles. Genetic material is a naked circular DNA (the nucleoid); many bacteria also have small circular DNA called plasmids.",
          "Ribosomes are 70S (50S + 30S). Several ribosomes on one mRNA form a polysome.",
          "Mesosomes are infoldings of the plasma membrane. They help in cell wall formation, DNA replication and distribution to daughter cells, respiration and secretion.",
          "The cell envelope has three layers: glycocalyx (slime layer or capsule), cell wall and plasma membrane. Gram staining divides bacteria into Gram-positive and Gram-negative.",
          "Mycoplasma has no cell wall.",
        ],
      },
      {
        heading: "Membrane and wall",
        points: [
          "Fluid mosaic model of the plasma membrane: Singer and Nicolson (1972). The quasi-fluid lipid bilayer lets proteins move sideways.",
          "In the human RBC membrane, about 52% is protein and 40% lipid.",
          "Plant cell wall: cellulose, hemicellulose, pectins and proteins. The middle lamella, mainly calcium pectate, holds neighbouring cells together. Plasmodesmata connect the cytoplasm of neighbouring cells.",
        ],
      },
      {
        heading: "Organelles",
        points: [
          "Endomembrane system = ER, Golgi complex, lysosomes and vacuoles. Mitochondria, chloroplasts and peroxisomes are NOT part of it.",
          "Rough ER (with ribosomes) makes and secretes proteins. Smooth ER is the main site of lipid synthesis; in animal cells it makes steroidal hormones.",
          "Golgi apparatus (Camillo Golgi, 1898): cis face (forming) and trans face (maturing). It packages materials and is the site of glycoprotein and glycolipid formation.",
          "Lysosomes form from the Golgi and contain hydrolytic enzymes that work best at acidic pH.",
          "Mitochondria: double membrane, inner membrane folded into cristae, matrix with a single circular DNA, a few RNA molecules and 70S ribosomes. They divide by fission and are the site of aerobic respiration.",
          "Plastids: chloroplasts (chlorophyll), chromoplasts (carotenoids) and leucoplasts. Leucoplasts store starch (amyloplasts), oils and fats (elaioplasts) or proteins (aleuroplasts).",
          "Ribosomes were first seen by George Palade (1953). Eukaryotic cytoplasm has 80S ribosomes (60S + 40S).",
          "Cilia and flagella have a 9+2 arrangement of microtubules (the axoneme). Centrioles and basal bodies have nine peripheral triplets (cartwheel) and no central pair.",
          "Nucleolus: site of active ribosomal RNA synthesis.",
          "By centromere position, chromosomes are metacentric (middle), sub-metacentric, acrocentric and telocentric (at the tip).",
        ],
      },
    ],
    table: {
      title: "Plant cell vs animal cell",
      head: ["Feature", "Plant cell", "Animal cell"],
      rows: [
        ["Cell wall", "Present", "Absent"],
        ["Plastids", "Present", "Absent"],
        ["Centrioles", "Absent in most", "Present"],
        ["Vacuole", "Large, central", "Small or absent"],
      ],
    },
    traps: [
      "Mitochondria and chloroplasts are not part of the endomembrane system: their functions are not coordinated with the ER, Golgi and lysosomes.",
      "Mitochondria and chloroplasts have 70S ribosomes even in eukaryotic cells.",
      "Leeuwenhoek saw a live cell first; Hooke's cork cells were dead.",
    ],
  },
  {
    slug: "cell-cycle-and-cell-division",
    chapter: "Cell Cycle and Cell Division",
    cls: 11,
    subject: "Biology",
    intro: "The phases of the cell cycle, mitosis and the sub-stages of meiosis I. NEET often asks which event happens in which stage.",
    sections: [
      {
        heading: "Cell cycle",
        points: [
          "A typical human cell divides about once every 24 hours; yeast takes about 90 minutes.",
          "Interphase (G1, S, G2) takes up more than 95% of the cycle. The M phase lasts only about an hour of a 24-hour human cell cycle.",
          "S phase: DNA doubles (2C to 4C) but the chromosome number stays the same. In animal cells the centriole also duplicates, in the cytoplasm.",
          "G0 (quiescent stage): cells that stay metabolically active but no longer divide, such as heart cells.",
        ],
      },
      {
        heading: "Mitosis",
        points: [
          "Prophase: chromatin condenses into chromosomes; centrioles move towards opposite poles. By its end the Golgi, ER, nucleolus and nuclear envelope are no longer seen.",
          "Metaphase: chromosomes line up at the equator (metaphase plate); spindle fibres attach to the kinetochores. This is the best stage to study chromosome shape.",
          "Anaphase: centromeres split and the sister chromatids move to opposite poles.",
          "Telophase: nuclear envelope, nucleolus, Golgi and ER reform around each set of chromosomes.",
          "Cytokinesis: a furrow in animal cells; a cell plate, from the centre outwards, in plant cells.",
          "Karyokinesis without cytokinesis gives a multinucleate syncytium, such as the liquid endosperm of coconut.",
        ],
      },
      {
        heading: "Meiosis I: prophase I sub-stages",
        points: [
          "Leptotene: chromosomes become visible.",
          "Zygotene: homologous chromosomes pair (synapsis), forming the synaptonemal complex; a pair is a bivalent or tetrad.",
          "Pachytene: crossing over between non-sister chromatids, at recombination nodules, by the enzyme recombinase.",
          "Diplotene: the synaptonemal complex dissolves; homologues stay joined at the X-shaped chiasmata. In the oocytes of some vertebrates this stage can last months or years.",
          "Diakinesis: chiasmata terminalise; the nucleolus and nuclear envelope disappear.",
          "Anaphase I: homologous chromosomes separate, while sister chromatids stay together. Interkinesis has no DNA replication.",
        ],
      },
    ],
    table: {
      title: "Mitosis vs meiosis",
      head: ["", "Mitosis", "Meiosis"],
      rows: [
        ["Divisions", "One", "Two (meiosis I and II)"],
        ["Daughter cells", "2, same chromosome number", "4, half the chromosome number"],
        ["Crossing over", "No", "Yes, in pachytene"],
        ["Where", "Body (somatic) cells", "Cells that form gametes or spores"],
      ],
    },
    traps: [
      "DNA content doubles in S phase but the number of chromosomes does not.",
      "Crossing over happens in pachytene; chiasmata become visible in diplotene.",
      "Sister chromatids separate in anaphase II, not anaphase I.",
    ],
  },
  {
    slug: "biological-classification",
    chapter: "Biological Classification",
    cls: 11,
    subject: "Biology",
    intro: "Whittaker's five kingdoms, the groups of Monera, Protista and Fungi with their examples, and viruses, viroids and lichens. NEET loves example-based questions here.",
    sections: [
      {
        heading: "Five-kingdom classification",
        points: [
          "R.H. Whittaker (1969): Monera, Protista, Fungi, Plantae and Animalia.",
          "Criteria: cell structure, body organisation, mode of nutrition, reproduction and phylogenetic relationships.",
        ],
      },
      {
        heading: "Kingdom Monera",
        points: [
          "Archaebacteria live in extreme habitats: halophiles (salty), thermoacidophiles (hot springs) and methanogens (marshes). Methanogens in the gut of ruminants such as cows produce methane (biogas).",
          "Cyanobacteria (blue-green algae) such as Nostoc and Anabaena: some fix atmospheric nitrogen in specialised cells called heterocysts.",
          "Chemosynthetic autotrophic bacteria oxidise inorganic substances such as nitrates, nitrites and ammonia to get energy.",
          "Mycoplasma: no cell wall, the smallest living cells known, and can survive without oxygen.",
        ],
      },
      {
        heading: "Kingdom Protista",
        points: [
          "Chrysophytes (diatoms, desmids): diatoms' silica walls form diatomaceous earth; they are the chief producers in the oceans.",
          "Dinoflagellates: rapid multiplication of red ones such as Gonyaulax makes the sea look red (red tides).",
          "Euglenoids such as Euglena: a protein-rich pellicle instead of a cell wall; photosynthetic in light, heterotrophic without light.",
          "Slime moulds: saprophytic; form a plasmodium; their spores have true walls and survive for years.",
          "Protozoans: amoeboid (Amoeba), flagellated (Trypanosoma, sleeping sickness), ciliated (Paramoecium) and sporozoans (Plasmodium, malaria).",
        ],
      },
      {
        heading: "Kingdom Fungi",
        points: [
          "Cell walls of chitin and polysaccharides.",
          "Phycomycetes: aseptate, coenocytic hyphae; zoospores or aplanospores. Examples: Mucor, Rhizopus, Albugo.",
          "Ascomycetes (sac fungi): ascospores; asexual conidia. Examples: Aspergillus, Claviceps, Neurospora; yeast is unicellular.",
          "Basidiomycetes: basidiospores; no sex organs, plasmogamy by fusion of two somatic cells. Examples: Agaricus (mushroom), Ustilago (smut), Puccinia (rust).",
          "Deuteromycetes (imperfect fungi): only the asexual stage is known. Examples: Alternaria, Colletotrichum, Trichoderma.",
        ],
      },
      {
        heading: "Viruses, viroids, lichens",
        points: [
          "Ivanowsky (1892) found that tobacco mosaic disease is caused by agents smaller than bacteria. Beijerinck called the infectious fluid contagium vivum fluidum. W.M. Stanley (1935) showed viruses can be crystallised, mostly as proteins.",
          "Viroids (T.O. Diener, 1971): free RNA without a protein coat; cause potato spindle tuber disease.",
          "Lichens: a partnership of algae (phycobiont) and fungi (mycobiont). They do not grow in polluted areas, so they are good pollution indicators.",
        ],
      },
    ],
    table: {
      title: "Fungi classes at a glance",
      head: ["Class", "Spores (sexual)", "Examples"],
      rows: [
        ["Phycomycetes", "Zygospores / oospores", "Mucor, Rhizopus, Albugo"],
        ["Ascomycetes", "Ascospores", "Aspergillus, Claviceps, Neurospora, yeast"],
        ["Basidiomycetes", "Basidiospores", "Agaricus, Ustilago, Puccinia"],
        ["Deuteromycetes", "None known", "Alternaria, Colletotrichum, Trichoderma"],
      ],
    },
    traps: [
      "Viroids have RNA only and no protein coat; viruses have a protein coat.",
      "Yeast is an ascomycete, even though it is unicellular.",
      "Heterocysts, which fix nitrogen, are in cyanobacteria, not in fungi.",
    ],
  },
  {
    slug: "plant-kingdom",
    chapter: "Plant Kingdom",
    cls: 11,
    subject: "Biology",
    intro: "Algae, bryophytes, pteridophytes, gymnosperms and angiosperms, with examples, and the three types of life cycle. NEET asks a lot of example and pigment questions.",
    sections: [
      {
        heading: "Algae",
        points: [
          "Chlorophyceae (green algae): chlorophyll a and b; store starch; cellulose walls. Examples: Chlamydomonas, Volvox, Ulothrix, Spirogyra, Chara.",
          "Phaeophyceae (brown algae): chlorophyll a and c and fucoxanthin; store laminarin and mannitol; algin. Examples: Ectocarpus, Dictyota, Laminaria, Sargassum, Fucus.",
          "Rhodophyceae (red algae): chlorophyll a and d and r-phycoerythrin; store floridean starch. Agar comes from Gelidium and Gracilaria. Examples: Polysiphonia, Porphyra, Gracilaria, Gelidium.",
          "Sexual reproduction can be isogamous, anisogamous or oogamous.",
        ],
      },
      {
        heading: "Bryophytes",
        points: [
          "Called the amphibians of the plant kingdom: they live on land but need water for sexual reproduction.",
          "The main plant body is the haploid gametophyte, attached by rhizoids. The sporophyte stays attached to the gametophyte and depends on it.",
          "Liverworts such as Marchantia reproduce asexually by gemmae.",
          "Mosses such as Funaria, Polytrichum and Sphagnum have a protonema stage. Sphagnum provides peat.",
        ],
      },
      {
        heading: "Pteridophytes",
        points: [
          "The first land plants with vascular tissues (xylem and phloem). The main plant body is the sporophyte.",
          "The gametophyte is a small, free-living prothallus that needs water for fertilisation.",
          "Most are homosporous. Selaginella and Salvinia are heterosporous, which is a step towards the seed habit.",
          "Classes: Psilopsida (Psilotum), Lycopsida (Selaginella, Lycopodium), Sphenopsida (Equisetum), Pteropsida (Dryopteris, Pteris, Adiantum).",
        ],
      },
      {
        heading: "Gymnosperms and angiosperms",
        points: [
          "Gymnosperms have naked ovules (not enclosed in an ovary). Cycas has coralloid roots with nitrogen-fixing cyanobacteria; Pinus roots have fungal mycorrhiza. Sequoia is one of the tallest trees.",
          "Angiosperms have ovules inside an ovary. Double fertilisation: one male gamete fuses with the egg (syngamy) and the other with the two polar nuclei (triple fusion), giving the triploid (3n) endosperm.",
        ],
      },
    ],
    table: {
      title: "Life cycle patterns",
      head: ["Pattern", "Dominant stage", "Examples"],
      rows: [
        ["Haplontic", "Haploid gametophyte", "Volvox, Spirogyra, Chlamydomonas"],
        ["Diplontic", "Diploid sporophyte", "Seed plants; Fucus among algae"],
        ["Haplo-diplontic", "Both multicellular", "Bryophytes, pteridophytes; Ectocarpus, Polysiphonia, kelps"],
      ],
    },
    traps: [
      "In bryophytes the gametophyte is dominant; in pteridophytes the sporophyte is dominant.",
      "Agar comes from red algae (Gelidium, Gracilaria); algin comes from brown algae.",
      "Heterospory in Selaginella and Salvinia is the precursor of the seed habit.",
    ],
  },
  {
    slug: "animal-kingdom",
    chapter: "Animal Kingdom",
    cls: 11,
    subject: "Biology",
    intro: "The basis of animal classification, the main features of each phylum, and the chordate classes with examples. Expect 2–4 NEET questions, many of them on examples.",
    sections: [
      {
        heading: "Basis of classification",
        points: [
          "Levels of organisation: cellular (sponges), tissue (coelenterates), organ (platyhelminthes) and organ system (the rest).",
          "Symmetry: radial in coelenterates, ctenophores and adult echinoderms; bilateral from platyhelminthes onwards.",
          "Diploblastic (two layers, with undifferentiated mesoglea between): coelenterates and ctenophores. Triploblastic: platyhelminthes to chordates.",
          "Coelom: acoelomates (platyhelminthes), pseudocoelomates (aschelminthes) and coelomates (annelids onwards).",
          "Metamerism (true segmentation) is seen in the earthworm. The notochord is a mesodermal rod on the dorsal side in chordates.",
        ],
      },
      {
        heading: "Non-chordate phyla",
        points: [
          "Porifera (sponges): canal system with ostia and osculum; choanocytes; skeleton of spicules or spongin; hermaphrodite. Sycon, Spongilla, Euspongia.",
          "Cnidaria: cnidoblasts (stinging cells); polyp and medusa forms, which alternate in Obelia (metagenesis). Physalia, Adamsia, Pennatula, Gorgonia, Meandrina.",
          "Ctenophora (comb jellies): eight comb plates for swimming; bioluminescence. Pleurobrachia, Ctenoplana.",
          "Platyhelminthes (flatworms): flame cells for excretion; mostly parasites. Taenia, Fasciola; Planaria regenerates well.",
          "Aschelminthes (roundworms): pseudocoelom; separate sexes, females longer than males. Ascaris, Wuchereria, Ancylostoma.",
          "Annelida: metameric segmentation; nephridia; Nereis has parapodia. Nereis, Pheretima (earthworm), Hirudinaria (leech).",
          "Arthropoda: the largest phylum; jointed legs; chitin exoskeleton; Malpighian tubules. Apis, Bombyx, Laccifer, Anopheles, Culex, Aedes, Limulus (living fossil).",
          "Mollusca: the second largest phylum; mantle; radula (rasping organ). Pila, Pinctada, Sepia, Loligo, Octopus.",
          "Echinodermata: water vascular system; calcareous ossicles; radial adults, bilateral larvae. Asterias, Echinus, Antedon, Cucumaria, Ophiura.",
          "Hemichordata: Balanoglossus, Saccoglossus.",
        ],
      },
      {
        heading: "Chordates",
        points: [
          "Three key features: notochord, dorsal hollow nerve cord and paired pharyngeal gill slits. Chordates also have a post-anal tail.",
          "Cyclostomata: jawless; ectoparasites on fishes; migrate to fresh water to spawn. Petromyzon (lamprey), Myxine (hagfish).",
          "Chondrichthyes: cartilaginous skeleton, placoid scales, no air bladder. Scoliodon, Pristis, Carcharodon; Trygon has a poison sting; Torpedo has electric organs.",
          "Osteichthyes: bony skeleton, air bladder, operculum over the gills. Exocoetus (flying fish), Hippocampus (sea horse), Labeo, Catla, Clarias.",
          "Amphibia: three-chambered heart. Bufo, Rana, Hyla, Salamandra, Ichthyophis (limbless).",
          "Reptilia: dry, cornified skin with scales; three-chambered heart except crocodiles (four). Chelone, Testudo, Chameleon, Calotes, Crocodilus, Hemidactylus; poisonous snakes Naja, Bungarus, Vipera.",
          "Aves: feathers, beak, pneumatic bones, crop and gizzard, four-chambered heart, warm-blooded. Corvus, Columba, Psittacula, Struthio, Pavo, Aptenodytes, Neophron.",
          "Mammalia: mammary glands, hair, external ears (pinnae), four-chambered heart; mostly viviparous. Ornithorhynchus (platypus) lays eggs.",
        ],
      },
    ],
    table: {
      title: "Body cavity (coelom)",
      head: ["Type", "Meaning", "Phylum"],
      rows: [
        ["Acoelomate", "No body cavity", "Platyhelminthes"],
        ["Pseudocoelomate", "Cavity not lined by mesoderm", "Aschelminthes"],
        ["Coelomate", "True cavity lined by mesoderm", "Annelida to Chordata"],
      ],
    },
    traps: [
      "Echinoderm adults are radially symmetrical but their larvae are bilateral.",
      "Crocodiles are the reptiles with a four-chambered heart.",
      "Limulus (king crab) is an arthropod and is called a living fossil.",
    ],
  },
  {
    slug: "molecular-basis-of-inheritance",
    chapter: "Molecular Basis of Inheritance",
    cls: 12,
    subject: "Biology",
    intro: "DNA structure, the experiments that proved DNA is the genetic material, replication, transcription, the genetic code, the lac operon and the Human Genome Project. One of the highest-weight chapters in NEET Biology.",
    sections: [
      {
        heading: "DNA structure",
        points: [
          "Nucleoside = nitrogen base + pentose sugar (N-glycosidic bond). Nucleotide = nucleoside + phosphate (phosphoester bond). Nucleotides join by 3'-5' phosphodiester bonds.",
          "Double helix: Watson and Crick (1953), based on X-ray diffraction data from Maurice Wilkins and Rosalind Franklin.",
          "Chargaff's rule: A = T and G = C. A–T pairs have two hydrogen bonds and G–C pairs have three.",
          "Pitch of the helix 3.4 nm, about 10 base pairs per turn, so about 0.34 nm between base pairs.",
          "Sizes: phage φX174 has 5386 nucleotides; phage lambda 48,502 bp; E. coli 4.6 × 10⁶ bp; haploid human DNA 3.3 × 10⁹ bp.",
          "Packaging: a histone octamer (two each of H2A, H2B, H3, H4) with DNA wrapped around it forms a nucleosome of about 200 bp. Histones are positive because they are rich in lysine and arginine. Euchromatin is loose and active; heterochromatin is dense and inactive.",
        ],
      },
      {
        heading: "DNA is the genetic material",
        points: [
          "Griffith (1928): heat-killed S strain of Streptococcus pneumoniae transformed live R strain, which then killed mice (the transforming principle).",
          "Avery, MacLeod and McCarty (1933–44): the transforming principle is DNA, because only DNase stopped transformation.",
          "Hershey and Chase (1952): bacteriophages with ³²P (in DNA) and ³⁵S (in protein). Radioactive phosphorus, not sulphur, entered the bacteria, so DNA is the genetic material.",
          "RNA was probably the first genetic material. DNA is more stable: RNA's 2'-OH makes it reactive, and thymine (instead of uracil) adds stability.",
        ],
      },
      {
        heading: "Replication and transcription",
        points: [
          "Replication is semi-conservative: Meselson and Stahl (1958), growing E. coli in ¹⁵N then ¹⁴N and separating DNA in a caesium chloride gradient. Taylor (1958) showed the same in Vicia faba with radioactive thymidine.",
          "DNA polymerase works only 5'→3'. One strand is copied continuously (leading); the other discontinuously in Okazaki fragments joined by DNA ligase. Replication starts at the origin of replication.",
          "Transcription unit: promoter, structural gene and terminator. The template strand runs 3'→5'; the coding strand has the same sequence as the RNA (with T in place of U).",
          "Bacteria have one RNA polymerase; the sigma factor helps it start and the rho factor helps it stop.",
          "Eukaryotes: RNA polymerase I makes rRNAs (28S, 18S, 5.8S); II makes hnRNA (precursor of mRNA); III makes tRNA, 5S rRNA and snRNAs.",
          "hnRNA processing: splicing removes introns and joins exons; capping adds methyl guanosine triphosphate at the 5' end; tailing adds a poly-A tail at the 3' end.",
        ],
      },
      {
        heading: "Genetic code and translation",
        points: [
          "Triplet code with 64 codons: 61 code for amino acids and 3 are stop codons (UAA, UAG, UGA). AUG codes for methionine and is the start codon.",
          "The code is unambiguous and specific, degenerate (some amino acids have several codons), nearly universal, and read without commas.",
          "tRNA is the adapter molecule (clover-leaf shape). Amino acids are activated and attached to their tRNA (charging).",
          "In bacteria the peptide bond is formed by 23S rRNA acting as a ribozyme.",
        ],
      },
      {
        heading: "Lac operon, HGP, fingerprinting",
        points: [
          "Lac operon (Jacob and Monod): i gene codes the repressor; structural genes z (β-galactosidase), y (permease) and a (transacetylase). Lactose is the inducer. This is negative regulation.",
          "Human Genome Project: launched 1990, completed 2003. 3164.7 million bp; about 30,000 genes; less than 2% of the genome codes for proteins; 99.9% of bases are the same in all people. Chromosome 1 has the most genes (2968) and Y the fewest (231); about 1.4 million SNPs.",
          "DNA fingerprinting (Alec Jeffreys) uses VNTRs, a kind of satellite DNA, detected by Southern blot hybridisation.",
        ],
      },
    ],
    table: {
      title: "Key experiments",
      head: ["Experiment", "Organism", "Showed"],
      rows: [
        ["Griffith (1928)", "S. pneumoniae + mice", "Transformation happens"],
        ["Avery, MacLeod, McCarty", "S. pneumoniae", "Transforming principle is DNA"],
        ["Hershey–Chase (1952)", "Bacteriophage", "DNA is the genetic material"],
        ["Meselson–Stahl (1958)", "E. coli", "Replication is semi-conservative"],
      ],
    },
    traps: [
      "Hershey–Chase used ³⁵S for protein and ³²P for DNA, not the other way round.",
      "The coding strand is not used as a template; it matches the mRNA sequence.",
      "AUG is both the start codon and the codon for methionine.",
    ],
  },
  {
    slug: "principles-of-inheritance-and-variation",
    chapter: "Principles of Inheritance and Variation",
    cls: 12,
    subject: "Biology",
    intro: "Mendel's laws, deviations from them, linkage, sex determination, and Mendelian and chromosomal disorders. Ratios and pedigree questions come every year.",
    sections: [
      {
        heading: "Mendel's laws",
        points: [
          "Mendel worked on garden pea (Pisum sativum) from 1856 to 1863, using seven pairs of contrasting traits.",
          "Law of dominance and law of segregation come from monohybrid crosses; the law of independent assortment comes from dihybrid crosses.",
          "Monohybrid F2: 3:1 phenotype, 1:2:1 genotype. Dihybrid F2: 9:3:3:1. A test cross (with the recessive parent) shows the F1 genotype.",
        ],
      },
      {
        heading: "Beyond Mendel",
        points: [
          "Incomplete dominance: snapdragon flower colour, F2 ratio 1:2:1 for both phenotype and genotype.",
          "Co-dominance and multiple alleles: ABO blood groups. Three alleles (Iᴬ, Iᴮ, i) give six genotypes and four phenotypes; IᴬIᴮ is blood group AB.",
          "In pea, one gene (B) controls both seed shape and starch-grain size: round seed shape shows dominance (Bb is round), but grain size shows incomplete dominance (Bb grains are intermediate).",
          "Pleiotropy: one gene, many effects (phenylketonuria). Polygenic inheritance: human skin colour.",
          "Chromosomal theory of inheritance: Sutton and Boveri. Morgan's Drosophila crosses showed linkage and recombination; Sturtevant used recombination frequency to map genes.",
        ],
      },
      {
        heading: "Sex determination",
        points: [
          "XO type (grasshopper): males have only one X. Henking first saw the X body.",
          "XY type (humans, Drosophila): males are heterogametic.",
          "ZW type (birds): females are heterogametic.",
          "Honey bee: males develop from unfertilised eggs (haploid); females from fertilised eggs (diploid).",
        ],
      },
      {
        heading: "Genetic disorders",
        points: [
          "Haemophilia and colour blindness: X-linked recessive, so far more common in males.",
          "Sickle-cell anaemia: autosomal recessive. Glutamic acid is replaced by valine at the sixth position of the β-globin chain (GAG to GUG).",
          "Phenylketonuria and thalassemia: autosomal recessive. Myotonic dystrophy: autosomal dominant.",
          "Down's syndrome: trisomy 21. Klinefelter's syndrome: 47, XXY. Turner's syndrome: 45, X0.",
        ],
      },
    ],
    table: {
      title: "Ratios to remember",
      head: ["Cross", "Phenotype ratio", "Genotype ratio"],
      rows: [
        ["Monohybrid (dominance)", "3 : 1", "1 : 2 : 1"],
        ["Monohybrid (incomplete dominance)", "1 : 2 : 1", "1 : 2 : 1"],
        ["Dihybrid", "9 : 3 : 3 : 1", "—"],
        ["Monohybrid test cross", "1 : 1", "1 : 1"],
      ],
    },
    traps: [
      "In birds the female (ZW) decides the sex of the offspring, not the male.",
      "AB blood group is co-dominance, not incomplete dominance.",
      "Klinefelter's is XXY (male); Turner's is X0 (female).",
    ],
  },
  {
    slug: "human-reproduction",
    chapter: "Human Reproduction",
    cls: 12,
    subject: "Biology",
    intro: "The male and female reproductive systems, gametogenesis, the menstrual cycle, fertilisation and pregnancy. Expect 2–3 NEET questions, often on hormones and the order of events.",
    sections: [
      {
        heading: "Male reproductive system",
        points: [
          "Testes sit in the scrotum, which keeps them 2–2.5 °C below body temperature. Each testis has about 250 lobules, each with one to three seminiferous tubules.",
          "Seminiferous tubules contain spermatogonia and Sertoli cells (which nourish germ cells). Leydig (interstitial) cells between the tubules make androgens.",
          "Duct path: rete testis, vasa efferentia, epididymis, vas deferens, ejaculatory duct, urethra.",
          "Accessory glands: paired seminal vesicles, a prostate and paired bulbourethral glands.",
        ],
      },
      {
        heading: "Gametogenesis",
        points: [
          "Spermatogenesis starts at puberty. GnRH from the hypothalamus raises LH and FSH; LH acts on Leydig cells (androgens), FSH on Sertoli cells. Spermatozoa are released by spermiation.",
          "A sperm has a head with an acrosome, a neck, a middle piece full of mitochondria and a tail.",
          "One ejaculate has about 200–300 million sperm. For normal fertility at least 60% must have normal shape and size and at least 40% must show vigorous motility.",
          "Oogenesis starts before birth. Primary oocytes stay in prophase I until puberty. At ovulation the secondary oocyte is released; it finishes meiosis II only after a sperm enters.",
        ],
      },
      {
        heading: "Menstrual cycle",
        points: [
          "About 28/29 days. Menstrual phase lasts 3–5 days.",
          "Follicular phase: FSH and LH rise gradually; follicles grow and secrete oestrogen; the endometrium regenerates.",
          "Ovulation around day 14 is triggered by the LH surge.",
          "Luteal phase: the corpus luteum secretes progesterone to maintain the endometrium. Without fertilisation it degenerates and menstruation follows.",
          "The first cycle is menarche; cycles stop at menopause, around 50 years.",
        ],
      },
      {
        heading: "Fertilisation and pregnancy",
        points: [
          "Fertilisation happens in the ampullary region of the oviduct. Once a sperm enters, the zona pellucida blocks other sperm.",
          "Zygote, cleavage, morula (8–16 blastomeres), then blastocyst with an outer trophoblast and an inner cell mass. The blastocyst implants in the endometrium.",
          "Placenta hormones: hCG, hPL, oestrogens and progestogens. Relaxin, secreted by the ovary in later pregnancy, also rises.",
          "Development: the heart forms after one month; limbs and digits by the end of the second month; most major organs by the end of the first trimester; first movements and hair on the head in the fifth month; fine hair, eyelids separating and eyelashes by the end of about 24 weeks (second trimester).",
          "Birth is triggered by the fetal ejection reflex; oxytocin causes strong uterine contractions. Colostrum, the first milk, is rich in IgA antibodies.",
        ],
      },
    ],
    table: {
      title: "Hormones and where they act",
      head: ["Hormone", "Source", "Main action"],
      rows: [
        ["LH", "Anterior pituitary", "Androgens from Leydig cells; ovulation (LH surge)"],
        ["FSH", "Anterior pituitary", "Sertoli cells; follicle growth"],
        ["Progesterone", "Corpus luteum", "Maintains the endometrium"],
        ["hCG", "Placenta", "Maintains pregnancy; basis of pregnancy tests"],
        ["Oxytocin", "Posterior pituitary", "Uterine contractions at birth"],
      ],
    },
    traps: [
      "The ovum completes meiosis II only after the sperm enters, not at ovulation.",
      "Fertilisation is in the ampulla of the oviduct, not in the uterus.",
      "Sertoli cells nourish developing sperm; Leydig cells make androgens.",
    ],
  },
  {
    slug: "biotechnology-principles-and-processes",
    chapter: "Biotechnology: Principles and Processes",
    cls: 12,
    subject: "Biology",
    intro: "Restriction enzymes, cloning vectors, getting DNA into host cells, PCR and bioreactors. NEET asks about enzyme naming, pBR322 and selection of recombinants.",
    sections: [
      {
        heading: "Tools of recombinant DNA technology",
        points: [
          "The first recombinant DNA (1972): Stanley Cohen and Herbert Boyer linked an antibiotic-resistance gene with a native plasmid of Salmonella typhimurium.",
          "The first restriction endonuclease characterised was Hind II, which always cuts at a particular six-base-pair sequence.",
          "Naming EcoRI: E = Escherichia (genus), co = coli (species), R = RY13 (strain), I = first enzyme isolated from that strain.",
          "Restriction enzymes recognise palindromic sequences and cut a little away from the centre, leaving single-stranded sticky ends that DNA ligase can join.",
          "Gel electrophoresis: DNA is negatively charged and moves towards the anode through an agarose gel (agarose comes from seaweeds). Smaller fragments move farther. Bands are seen after ethidium bromide staining under UV light (orange).",
        ],
      },
      {
        heading: "Cloning vectors",
        points: [
          "A vector needs an origin of replication (ori), a selectable marker and cloning sites.",
          "Common markers are genes for resistance to ampicillin, chloramphenicol, tetracycline or kanamycin.",
          "pBR322: inserting DNA at the BamHI site inactivates the tetracycline-resistance gene; at the PvuI site, the ampicillin-resistance gene (insertional inactivation).",
          "Blue-white selection: inserts into the lacZ gene (β-galactosidase) stop the blue colour. Recombinant colonies are white; non-recombinant colonies are blue.",
          "Agrobacterium tumefaciens (Ti plasmid) and retroviruses are used as disarmed vectors.",
        ],
      },
      {
        heading: "Getting DNA in, copying it, scaling up",
        points: [
          "Competent host: treat bacteria with calcium ions, put on ice, heat-shock at 42 °C, back on ice. Other methods: micro-injection into animal cell nuclei and biolistics (gene gun with gold or tungsten particles) for plants.",
          "Isolating DNA: break the cell wall with lysozyme (bacteria), cellulase (plants) or chitinase (fungi); remove RNA with ribonuclease and proteins with protease; precipitate DNA with chilled ethanol.",
          "PCR: denaturation, annealing of primers, extension. It uses a thermostable DNA polymerase from Thermus aquaticus.",
          "Large-scale production uses bioreactors, most commonly the stirred-tank type. Downstream processing separates and purifies the product.",
        ],
      },
    ],
    table: {
      title: "Selecting recombinants",
      head: ["Method", "Recombinant colonies", "Non-recombinant colonies"],
      rows: [
        ["pBR322, insert at BamHI", "Grow on ampicillin, not tetracycline", "Grow on both"],
        ["Blue-white (lacZ)", "White", "Blue"],
      ],
    },
    traps: [
      "In EcoRI, R stands for the strain RY13, not 'restriction'.",
      "DNA moves towards the anode (positive electrode) in gel electrophoresis.",
      "The first restriction endonuclease characterised was Hind II, not EcoRI.",
    ],
  },
  {
    slug: "human-health-and-disease",
    chapter: "Human Health and Disease",
    cls: 12,
    subject: "Biology",
    intro: "Common diseases and their pathogens, immunity, AIDS, cancer, and drugs and alcohol. NEET asks pathogen–disease matching and immunity questions almost every year.",
    sections: [
      {
        heading: "Common diseases",
        points: [
          "Typhoid: Salmonella typhi; confirmed by the Widal test. 'Typhoid Mary' (Mary Mallon) was a cook who carried it for years.",
          "Pneumonia: Streptococcus pneumoniae and Haemophilus influenzae; infects the alveoli; in severe cases lips and finger nails turn grey to bluish.",
          "Common cold: rhinoviruses; infects the nose and respiratory passage but not the lungs.",
          "Malaria: Plasmodium vivax, P. malariae and P. falciparum (the most serious, malignant malaria). The female Anopheles injects sporozoites. Rupture of RBCs releases haemozoin, which causes the chill and high fever. Gametocytes form in human RBCs; fertilisation happens in the mosquito.",
          "Amoebiasis: Entamoeba histolytica; houseflies carry the parasite mechanically.",
          "Ascariasis: Ascaris. Filariasis (elephantiasis): Wuchereria (W. bancrofti, W. malayi), spread by the female Culex mosquito.",
          "Ringworm: fungi Microsporum, Trichophyton and Epidermophyton.",
        ],
      },
      {
        heading: "Immunity",
        points: [
          "Innate immunity has four kinds of barriers: physical (skin, mucus), physiological (stomach acid, saliva, tears), cellular (neutrophils, monocytes, natural killer cells, macrophages) and cytokine (interferons).",
          "Acquired immunity has memory: the secondary (anamnestic) response is stronger than the primary one.",
          "B-lymphocytes make antibodies (humoral immunity); an antibody has two heavy and two light chains (H₂L₂). Types: IgA, IgM, IgE, IgG. T-lymphocytes give cell-mediated immunity, which is why transplanted organs can be rejected.",
          "Active immunity: the body makes its own antibodies (infection or vaccine). Passive immunity: ready-made antibodies are given (colostrum IgA, anti-tetanus serum).",
          "Hepatitis B vaccine is made with recombinant DNA technology in yeast.",
          "Allergy: IgE antibodies; mast cells release histamine and serotonin. Treated with antihistamines, adrenaline and steroids.",
          "Primary lymphoid organs: bone marrow and thymus. Secondary: spleen, lymph nodes, tonsils, Peyer's patches and appendix. MALT makes up about 50% of the body's lymphoid tissue.",
        ],
      },
      {
        heading: "AIDS and cancer",
        points: [
          "AIDS is caused by HIV, a retrovirus. Its RNA is copied into DNA by reverse transcriptase; the macrophage becomes an HIV factory; helper T-cells are attacked and their number falls. Diagnosis: ELISA.",
          "Cancer cells lose contact inhibition. Benign tumours stay in place; malignant tumours spread (metastasis).",
          "Carcinogens: ionising radiation (X-rays, gamma rays), non-ionising UV, chemicals in tobacco smoke, and oncogenic viruses. Proto-oncogenes can become oncogenes.",
          "Detection: biopsy, radiography, CT and MRI; monoclonal antibodies. Treatment: surgery, radiotherapy, chemotherapy and immunotherapy with α-interferon.",
        ],
      },
      {
        heading: "Drugs and alcohol",
        points: [
          "Opioids bind opioid receptors in the brain and gut. Heroin (smack, diacetylmorphine) is a depressant made from morphine, from the latex of the poppy Papaver somniferum.",
          "Cannabinoids from Cannabis sativa affect the cardiovascular system.",
          "Cocaine from the coca plant Erythroxylum coca interferes with dopamine transport.",
          "Nicotine stimulates the adrenal gland to release adrenaline and noradrenaline, raising blood pressure and heart rate.",
        ],
      },
    ],
    table: {
      title: "Pathogen and disease",
      head: ["Disease", "Pathogen", "Type"],
      rows: [
        ["Typhoid", "Salmonella typhi", "Bacterium"],
        ["Pneumonia", "Streptococcus pneumoniae, Haemophilus influenzae", "Bacteria"],
        ["Common cold", "Rhinoviruses", "Virus"],
        ["Malaria", "Plasmodium species", "Protozoan"],
        ["Amoebiasis", "Entamoeba histolytica", "Protozoan"],
        ["Filariasis", "Wuchereria", "Helminth"],
        ["Ringworm", "Microsporum, Trichophyton, Epidermophyton", "Fungi"],
      ],
    },
    traps: [
      "The common cold does not infect the lungs; pneumonia does.",
      "Filariasis is spread by Culex; malaria by female Anopheles.",
      "Colostrum gives passive immunity through IgA.",
    ],
  },
];

export const ncertMeta = (n: NcertNote) => ({
  title: `${n.chapter}: NCERT Class ${n.cls} ${n.subject} Notes for NEET | YNeet`,
  description: `Short NCERT notes on ${n.chapter} (Class ${n.cls} ${n.subject}) for NEET: key points, a quick comparison table and common traps. Free, then practise the chapter's PYQs.`,
});
