/* ===== tigOS content: every fact below comes from Chase's resume (Aug 2026) or Figma portfolio PDF ===== */
var TIG = {
  person: {
    name: 'Chase Johnston',
    handle: 'chasetiger',
    title: 'Marketing Manager',
    tagline: 'Product Marketing, GTM & Growth',
    company: 'Amazon',
    org: 'Worldwide Grocery · New & Emerging Brands',
    location: 'New York, NY',
    summary: 'Marketing manager with 5+ years of experience across small-business, product, and customer marketing. Built marketing programs for local businesses, supported the launch of Apple Business Essentials, and now own customer-facing marketing for Amazon\u2019s Emerging Brands initiative.',
    bio: 'Chase Johnston is a Marketing Manager at Amazon focused on customer-facing marketing strategy across Amazon.com and Worldwide Grocery. He leads vendor marketing initiatives, digital merchandising, and campaign strategy for New and Emerging Brands, helping drive engagement and brand visibility across Amazon-owned channels. Prior to Amazon Marketing, Chase supported partner growth and go-to-market initiatives within Amazon Hub Delivery across major U.S. markets. With previous experience at Apple and running his own marketing agency in college, he brings a mix of creative storytelling, brand strategy, and data-driven execution to every project.'
  },
  contact: {
    email: 'chasetigerjohnston@gmail.com',
    phone: '509-844-7086',
    site: 'chasetiger.com',
    linkedin: 'https://www.linkedin.com/in/chase-tiger-johnston/',
    linkedinLabel: 'linkedin.com/in/chase-tiger-johnston'
  },
  stats: [
    { big: '10x', label: 'Campaign growth YoY', sub: '35 campaigns in 2025 to 350+ in 2026' },
    { big: '~40%', label: 'Click-through lift', sub: 'Sharper GTM strategy and creative testing' },
    { big: '$11.9M', label: 'B2B revenue', sub: 'SMB portfolio at Apple' },
    { big: '2,800+', label: 'Partner network', sub: 'Amazon Hub Delivery, from zero partners' },
    { big: '$1.3M+', label: 'Email-attributed revenue', sub: '6,000+ subscribers at Johnny Mo\u2019s' },
    { big: '42%', label: 'Avg. open rate', sub: 'Hub onboarding series, 12% above baseline' }
  ],
  experience: [
    {
      id: 'amz-mkt', company: 'Amazon', role: 'Marketing Manager, Worldwide Grocery', dates: '2025 \u2013 Present', where: 'New York, NY', accent: 'orange', current: true,
      bullets: [
        'Established the marketing strategy and rebuilt the customer-facing experience for Amazon\u2019s New & Emerging Brands initiative across Amazon Fresh and Amazon Grocery, including a new rotating homepage placement that drives discovery and lifecycle engagement for eligible brands.',
        'Own multiple customer-facing web pages on Amazon.com, including New to Grocery, Emerging Brands, Grocery \u201cFor You,\u201d and Amazon Fresh Storefront, plus all new page creation across the Grocery storefront.',
        'Scaling the program 10x year over year, from 35 campaigns in 2025 to 350+ in 2026, while lifting click-through rate ~40% through sharper GTM strategy and creative testing.',
        'Use AI tools to independently design and build a performance dashboard now used weekly by the marketing team and three outside agencies, tracking 300+ campaigns across 70+ brands.'
      ]
    },
    {
      id: 'amz-hub', company: 'Amazon', role: 'Partner Management, Hub Delivery', dates: '2023 \u2013 2025', where: 'Seattle, WA & Los Angeles, CA', accent: 'blue',
      bullets: [
        'Joined Amazon Hub Delivery as one of its first hires when it was an unproven pilot with zero partners; helped build the early partner-management playbook and later managed 250+ partners across Seattle and Los Angeles as the program scaled to a 2,800+ partner network nationally.',
        'Built a 9-page onboarding packet and 4-week email series that is now the national standard for new partner launches, improving launch readiness across the network.',
        'Partnered with Marketing and Creative on partner-facing video campaigns and national rollout initiatives, and led Partner Spotlight storytelling featuring hub partner success stories in partner communications.'
      ]
    },
    {
      id: 'apple', company: 'Apple', role: 'Business Account Manager, Apple Business Essentials', dates: '2021 \u2013 2024', where: 'Remote', accent: 'pink',
      bullets: [
        'Partnered with Apple\u2019s Product Marketing organization on the go-to-market launch of Apple Business Essentials (now Apple Business), shaping customer-facing content and storytelling across Apple.com and business.apple.com.',
        'Managed a portfolio of SMB business accounts, generating $11.9M in B2B revenue and translating customer outcomes into the small business success stories Apple features on Apple.com.',
        'Supported customer education and adoption for GTM pilots focused on business enablement, helping translate new features into simple, sellable stories that supported long-term account growth and retention.'
      ]
    },
    {
      id: 'jm', company: 'Johnny Mo\u2019s Pizzeria', role: 'Director of Marketing', dates: '2020 \u2013 2023', where: 'Seattle, WA', accent: 'red',
      bullets: [
        'Owned digital marketing strategy (email, social, and in-store) for a growing Seattle pizzeria brand.',
        'Built a 6,000+ subscriber email program generating $1.3M+ in campaign-attributed revenue; 8+ standalone campaigns each drove $100K+ in incremental revenue.',
        'Designed johnnymos.com and in-store menus, plus led content creation, photography, and promotional design supporting brand build-out and expansion across multiple Seattle locations.'
      ]
    },
    {
      id: 'tig', company: 'Tig Media', role: 'Founder', dates: '2021 \u2013 2023', where: 'Seattle, WA', accent: 'teal',
      bullets: [
        'Founded and ran a small business marketing agency serving 10+ local clients across email, social, and brand design; grew revenue roughly 4x in the first six months.'
      ]
    }
  ],
  alsoWorkedWith: ['Banner Bank', 'TJX'],
  cities: {
    spokane:   { city:'Spokane',   state:'WA', lon:-117.426, lat:47.659, accent:'amber' },
    seattle:   { city:'Seattle',   state:'WA', lon:-122.335, lat:47.608, accent:'teal', side:'left' },
    cupertino: { city:'Cupertino', state:'CA', lon:-122.032, lat:37.323, accent:'pink', side:'left' },
    parkcity:  { city:'Park City', state:'UT', lon:-111.498, lat:40.646, accent:'violet' },
    nyc:       { city:'New York',  state:'NY', lon:-74.006,  lat:40.713, accent:'orange' }
  },
  journey: [
    { id:'spokane-roots', city:'spokane', accent:'amber', years:'Nov 1999 \u2013 Oct 2020', company:'TJX Companies & Banner Bank', role:'Growing up, and the first jobs',
      blurb:'Born and raised in Spokane. The first paychecks came from TJX Companies and Banner Bank, and with them the first lessons in retail, customers, and showing up.', tags:['Hometown','TJX Companies','Banner Bank'] },
    { id:'seattle-uw', city:'seattle', accent:'teal', years:'Oct 2020 \u2013 Oct 2021', company:'University of Washington', role:'BA, Marketing Communications \u00b7 founded Tig Media',
      blurb:'Moved west for UW. Started Tig Media during school, a small-business marketing agency that grew to 10+ local clients, and took on marketing for Johnny Mo\u2019s Pizzeria on the side.', tags:['UW','Tig Media, founder','Johnny Mo\u2019s'] },
    { id:'apple-cupertino', city:'cupertino', accent:'pink', years:'Oct 2021 \u2013 Apr 2022', company:'Apple', role:'Intern, Apple Business Essentials',
      blurb:'Six months in Cupertino with Apple\u2019s Product Marketing team as Apple Business Essentials went to market, interviewing small business owners for the stories on apple.com.', tags:['Internship','GTM launch','Customer stories'] },
    { id:'apple-seattle', city:'seattle', accent:'pink', years:'Apr 2022 \u2013 Apr 2023', company:'Apple', role:'Business Account Manager, Apple Business Essentials \u00b7 Seattle office, hybrid',
      blurb:'Back to Seattle, hybrid out of Apple\u2019s Seattle office. Managed an SMB portfolio that reached $11.9M in B2B revenue while finishing the degree at UW, Class of 2022.', tags:['$11.9M B2B','Hybrid','Class of 2022'] },
    { id:'apple-parkcity', city:'parkcity', accent:'pink', years:'Apr 2023 \u2013 Oct 2023', company:'Apple', role:'Business Account Manager \u00b7 remote',
      blurb:'Six months working remotely from the mountains in Park City. Same accounts and GTM pilots, much better views.', tags:['Remote','Mountain office'] },
    { id:'amazon-hub', city:'seattle', accent:'blue', years:'Oct 2023 \u2013 Dec 2025', company:'Amazon', role:'Partner Management, Hub Delivery',
      blurb:'Back in Seattle as one of the first hires on Amazon Hub Delivery when it had zero partners. Helped write the playbook, built the onboarding packet and email series that became the national standard, and managed 250+ partners across Seattle and LA.', tags:['0 to 250+ partners','Onboarding packet','National standard'] },
    { id:'amazon-nyc', city:'nyc', accent:'orange', years:'Dec 2025 \u2013 Present', company:'Amazon', role:'Marketing Manager, Worldwide Grocery Stores', current:true,
      blurb:'Moved to New York to own customer-facing marketing for New & Emerging Brands across Amazon Fresh and Grocery: 10x campaign growth, ~40% CTR lift, and a dashboard the team and three agencies use weekly.', tags:['10x campaigns','~40% CTR lift','Dashboard'] }
  ],
  education: {
    school: 'University of Washington', where: 'Seattle, WA', degree: 'BA, Marketing Communications', year: 'Class of 2022'
  },
  skills: {
    groups: [
      { name: 'Marketing', accent: 'orange', items: ['Go-to-Market Strategy', 'Product Marketing', 'Lifecycle & Digital Marketing', 'Website & Page Ownership / Design', 'Brand Storytelling', 'Cross-Functional Leadership', 'Email Campaigns', 'Content & Social', 'Account Management', 'Communication'] },
      { name: 'AI & Tools', accent: 'teal', items: ['Claude', 'OpenAI', 'Internal Amazon AI Tools', 'Salesforce', 'HubSpot', 'Pardot', 'Adobe Creative Suite', 'Canva', 'IntelliJ IDEA', 'VS Code'] }
    ]
  },
  projects: [
    {
      id: 'eb', n: 1, company: 'Amazon', name: 'Emerging Brands, rebuilt', tag: 'Amazon.com · Worldwide Grocery', accent: 'orange',
      overview: 'I led the full overhaul of the Emerging Brands experience on Amazon.com within Worldwide Grocery. The previous page lacked strong storytelling, organization, and a clear customer journey for discovering new brands and products.',
      execution: 'I independently redesigned the page experience from the ground up, including layout structure, vendor placement strategy, campaign organization, and overall brand presentation. I focused on creating a cleaner, more modern experience that made it easier for customers to discover emerging products while also improving visibility opportunities for vendors.',
      results: 'The redesigned experience created a more scalable and engaging destination for New and Emerging Brands on Amazon.com, improving overall organization, brand visibility, and customer experience across the page.',
      metrics: [['10x', 'campaign growth YoY'], ['350+', 'campaigns in 2026'], ['~40%', 'CTR lift']],
      images: [['eb_phones', 'Emerging Brands in the Amazon Fresh app'], ['eb_desktop', 'Emerging Brands on Amazon.com desktop'], ['eb_banner', 'Emerging Brands hero banner']]
    },
    {
      id: 'packet', n: 2, company: 'Amazon', name: 'Hub partner onboarding packet', tag: 'Amazon Hub Delivery', accent: 'blue',
      overview: 'I created a 9-page onboarding packet to simplify how new partners launch with Amazon Hub Delivery. Before this, partners received fragmented information from multiple sources, which caused confusion and delays.',
      execution: 'I worked cross-functionally with Operations, Tech, Marketing, and the Creative Garage to consolidate all key resources into one visual physical document. Each section walked partners through setup, delivery expectations, and Hub branding in a clean, easy-to-follow layout.',
      results: 'The packet became the standard onboarding document for all new Hub partners nationwide.',
      metrics: [['9', 'pages'], ['National', 'standard for new partners'], ['4', 'teams: Ops, Tech, Marketing, Creative Garage']],
      images: [['hub_packet', 'Packet cover and table of contents'], ['hub_support', 'Support and account manager page']]
    },
    {
      id: 'lifecycle', n: 3, company: 'Amazon', name: '4-week partner lifecycle emails', tag: 'Amazon Hub Delivery · Pardot', accent: 'blue',
      overview: 'To improve partner engagement after launch, I built a 4-week onboarding email campaign that walked partners through critical milestones during their first month.',
      execution: 'I developed themed content for each week (Setup, Quality, Growth, and Community) and automated the sequence through Pardot. I also tested subject lines and content formats to optimize open and click-through rates.',
      results: 'The campaign achieved a 42% average open rate (12% above baseline) and boosted partner retention by ~8%. It\u2019s now used across all Hub markets as a standard lifecycle campaign.',
      metrics: [['42%', 'avg. open rate'], ['+12%', 'vs. baseline'], ['~8%', 'retention lift']],
      images: [['hub_email2', 'Week 2: Quality'], ['hub_email4', 'Week 4: Growth and referrals']]
    },
    {
      id: 'apple', n: 4, company: 'Apple', name: 'Small business stories', tag: 'Apple Business Essentials', accent: 'pink',
      overview: 'I worked with Apple\u2019s Product Marketing team in Cupertino during the rollout of Apple Business Essentials, helping collect and develop real customer stories for Apple\u2019s Small Business website.',
      execution: 'I interviewed small business owners across the US to uncover how Apple devices supported their operations. Using these insights, I collaborated with various Cupertino-based teams to shape narrative direction and feedback on beta usability to improve product positioning.',
      results: 'These stories were featured publicly on apple.com/business/small-business.',
      metrics: [['$11.9M', 'B2B revenue managed'], ['apple.com', 'featured stories'], ['GTM', 'launch support']],
      images: [['apple_story', 'Customer story on apple.com'], ['apple_abe', 'Apple Business Essentials']]
    },
    {
      id: 'jm', n: 5, company: 'Johnny Mo\u2019s', name: 'A restaurant brand book', tag: 'Johnny Mo\u2019s Pizzeria', accent: 'red',
      overview: 'When starting Johnny Mo\u2019s, the restaurant had no formal branding, just a logo and word-of-mouth marketing. I led the creation of the brand book to define its visual identity and customer tone.',
      execution: 'I partnered with designers in New York to build a brand guide covering color palettes, typography, tone of voice, and in-store visuals. I applied it across social, email, and menus to create a cohesive brand experience.',
      results: 'Engagement across digital channels rose ~20%, online orders increased 13.5%, and the brand book became the foundation for their second location\u2019s launch.',
      metrics: [['$1.3M+', 'email-attributed revenue'], ['6,000+', 'subscribers'], ['13.5%', 'more online orders']],
      images: [['jm_photo', 'Recommended by Restaurant Guru'], ['jm_menu', 'Menu design'], ['jm_email', 'Welcome email']]
    },
    {
      id: 'tig', n: 6, company: 'Tig Media', name: 'A college agency for small business', tag: 'Tig Media LLC · Founder', accent: 'teal',
      overview: 'While in college, I founded Tig Media LLC, a marketing agency focused on helping small businesses grow through creative, affordable marketing strategies.',
      execution: 'I led a three-person team managing 10+ clients across Washington state and Idaho. We built custom marketing plans, ran social campaigns, designed websites, and produced ads for local restaurants and retail shops.',
      results: 'Revenue grew roughly 4x in the first six months, and Tig Media became a local agency for small businesses seeking modern marketing without enterprise costs.',
      metrics: [['10+', 'clients'], ['~4x', 'revenue in six months'], ['Three', 'person team']],
      images: [['tig_site', 'Tig Media website'], ['tig_mba', 'Client site: Mike Bass Associates'], ['tig_aleppo', 'Client menu: Aleppo Kitchen']]
    }
  ]
};

TIG.map = {cols:480, rows:240, lat0:74.0, lat1:-56.0, bits:["AAAAAAAAAAAAP/gAAAD+AAAAAAAP///////4AAAAAAAAAAAAAAAA+AAAAAQ/////+gAAAAAAAAAAAAAA","AAAAAAAAAAAAP/wAEH7+HG8AAAAH///////4AAAAAAAAAAAAAAAA+AAAAB///////vgMAAAeAAAAAAAA","AAAAAAAAAAAAP/wAeH7+Oe+AAAAH///////4AAAAAAAAAAAAAAAA8AAAAB////////4PwAA/AAAAAAAA","AAAAAAAAAAAAP/oA+Hz8e//AAAAH///////gAAAAAAAAAAAAAAAB8AAAAB////////4P4AAPAAAAAAAA","AAAAAAAAAAAAf/8B8Hz8+/fgAAAD//////+AAAAAAAAAAAAAAAAD8AAEAB/////////v8AAAAAAAAAAA","AAAAAAAAAAAAf//l8f74//7AAAAD///////AAAAAAAAAAAAAAAAD4AAPkB//////////8AAYAAAAAAAA","AAAAAAAAAAAAf//+8f/w//mAAAAB///////AAAAAAAAAAAAAAAAD4AAPmB//////////8AA/gAAAAAAA","AAAAAAAAAAAA/7/+8P/h//ngAAAD//////5gAAAAAAAAAAAAAAADwAAPiB//////////8AB//AAAAAAA","AAAAAAAAAAAA/3/+8H/h///wAAAD//////+AAAAAAAAAAAAAAAAHwAAfm+//////////8AA//wAAAAAA","AAAAAAAAAAAA/3//+D5B///4AAAD//////+AAAAAAAAAAAAAAAAPwAAfn///////////8AA//wAAAAAA","AAAAAAAAAAAAf3//+B7g///4AAAH///////AAAAAAAAAAAAAAAAPwAA/v///////////8Ii//4AAAAAA","wAAAAAAAAAAAPz//+Bzw////AAAD///////gAAAAAAAAAAAAAAAH4AA/f///////////+P///4AAAAAB","4AAAA4AAAAAAHB//+AH4////gAAAf//////gAAAAAAAAAAQAAAAB8AB/v///////////+f///+AAAAAD","wAAAB8AAAAAACD//+AH4f///gAAAP//////gAAAAAAAAAP4AAAAB8AB/v/////////////////fwAAAD","AAAAH/gAAAAAAD///AH4f///8AAB//////7gAAAAAAAAAP+AAAAA+AB/n//////////////////4AAAA","AAAAf//AAAAEAAB//gH8f///+AAB//////wAAAAAAAAAAf/AAAAAAAB/n//////////////////4AAAA","AAAB///4gAAGAAf//4H8H///+AAB//////+AAAAAAAAAD/+AAAAAAAB/v//////////////////4AAAA","AAAB////wAB+QA///8z8A////AAB///////AAAAAAAAAP/+AAAAAAAB/v//////////////////4ABwA","AAAD////+AH/bg///4/8A9B//AAB7/////+AAAAAAAAAf//wAAAAAPB/v//////////////////84D/w","AAAD/////h///w///x9/A+B//gABz/////8AAAAAAAAA///4AAAAAPx/v////////////////////5/8","AAAH/////z///8f//x+/Q/A//gAAD/////4AAAAAAAAB////AAAAAH4fv////////////////////5//","gAA///////////7/BwE/w/A//AAAH/////gAAAAAAAAD////wAABAH+fn////////////////////9//","wAA////////////x8AA/5/Af+AAAP/////AAAAAAAAAD////4AADhv/P3///////////////////////","4AB///////////8B8A8/5+AH/gAAf////+AAAAAAAAAH////8DgPf///3///////////////////////","8AAf//////////4B/g//5+Bz/wAAf////wAAAAAAAAAP/////Dwf////3///////////////////////","+AAP//////////88////7/Bz/8AA////+AAAAAAAAAAf/////D5/////z///////////////////////","/AAH////////////////7/Bx/+AA////8AAAAAAAAAAf/////jj/////n///////////////////////","/gAH//////////////////Bh/+AA////8AAAAAAAAAA//////jj/////n///////////////////////","/+AD/////////////////+AD//wA////4AAAAAAAAAA//////hn/////P///////////////////////","//AN/////////////////8AD//wA////4AAAAAAAAAB//////h//////f///////////////////////","//gc/////////////////QAH//wA////gADgeAAAAAB////4/d//////////////////////////////","//h/////////////////+AAH/PgA////AAD3+AAAAAD////8M///////////////////////////////","//j//////////////////AAH/PgAf//8AAH/+AAAAAD//H/+B///////////////////////////////","r8D/////////////////9gA//HAAP//gAAB//AAAAAH/+H/+B///////////////////////////////","h8B/////////////////94D//iAAP//gAAB//AAAAAH/+H/+R///////////////////////////////","A8A/////////////////98H//wAAP//AAAD/+AAAAAP/+P/+9///////////////////////////////","AcAKf///////////////5+H//4AAP//AAAA/+AAAAAP/+f/+f//////////////////////////////4","AAAAf///////////////7/AD/8AAP//AAAA/4AAAAAf/8//////////////////////////////////8","AAAAf///////////////D/gB/8AAH//AAAAfgAAAAA//9//////////////////////////////////8","ABwB///////////////+BxgB/8AAH/+AAAAAAAAAAB//x//////////////////////////////////+","AAYP///////////////+AAAA/cAAD/8AAAAAAAAAAH//j//////////////////////////////////+","AAAP///////////////8AOAAPsAAD/8AAAAAAAAAAP//D///////////////////////////////////","AAAf///////////////4AMTkHwAAB/4AAAAAAAAAAf//D///////////////////////////////3//2","AAAf///////////////wAAb+AwAAB/8AAAAAAAAAAf//D///////////////////////////////3//g","AAA////////////////wAAT/AAAAA/8AAAAAAAAAA//+D///////////////////////////////v/+A","AAAf///////////////gAAD/gAAAA/4AAAAAAAAAA//+D/////////////////////////////+PP/4A","AAAf///////////////gAAD/4AAAAf4AAAAAAAAAAf//D/////////////////////////////8Gf/wA","AAAf///v///////////gAAD/4AAAAB4AAAAAAAAAAf//D/////////////////////////////8E//gA","AABv///j///////////AAAD/4EAAAB4AAAAAAAAAAf//g+P///////////////////////////4B/zAA","AABn///gH//////////AAAD/8GAAAAAAAAAAAAAAAf//gwP///////////////////////////wB/gAA","AAAA/+cAB//////////AAAD/8OAAAAAAAAAAAAAAAf//gH////////////////////////////wDwAAA","AAAA/+AAA//////////AAAD/8PAAAAAAAAAAAAAAAfv/Af//////////////////////////AH4HwAAA","AAAAv/AAAf/////////wAAH/+fAAAAAAAAAAAAAAAfv+Af/////////////////////////4AAAPgAAA","AAAAA+AAAH/////////wAAD///gAAAAAAAAAAABwAPH+AP/////////////////////////wAAAfgAAA","AAAAB9gAAAf////////4AAB///gAAAAAAAAAAADgAAH8QP/////////////////////////wAAB/AAAA","AAAAB7gAAAf////////4AAB///wAAAAAAAAAAAD8AAX8xv/////////////////////////gAAB/wAAA","AAAADzAAAAP/////////AAA///wAAAAAAAAAAAD4ABz+jv/////////////////////////AAAD/wAAA","AAAAHiAAAAH/////////wAA///wAAAAAAAAAAAD4ABz+D/////////////////////////+AAAD/wAAA","AAAAOAAAAAH/////////4AB///wAAAAAAAAAAAD4AB78D/////////////////////////8AAAH/wAAA","AAAA+AAAAAD/////////+AB///4AAAAAAAAAAAD8AB3wD/////////////////////////4AAAH/AAAA","AAABwAAAAAD//////////AD///8AAAAAAAAAAAD8ABvgD/////////////////////////wAAAH/AAAA","AAAHAAAAAAB//////////+H////gAAAAAAAAAAd+ABmAH/////////////////////////gAAAH/AAAA","AAAOAAAAAAA//////////+P////wAAAAAAAAAA8+ABwDv/////////////////////////wAAAH+AAAA","AAAAAAAAAAA//////////8P////wAAAAAAAAAB8fAB/P//////////////////////////5iAAH8AAAA","AAAAAAAAAAOf/////////+P////4AAAAAAAAAB8PAH/////////////////////////////yAAH8AAAA","AAAAAAAAAAEf/////////+H////8AAAAAAAAAB9/gf/////////////////////////////+AAD8AAAA","AAAAAAAAAAEP/////////+H////8AAAAAAAAAB9/w//////////////////////////////+AADwAAAA","AAAAAAAAAACH//////////H////8AAAAAAAAAB4/x//////////////////////////////+AADgAAAA","AAAAAAAAAAAH//////////P////8AAAAAAAAABx/x//////////////////////////////+AADgAAAA","AAAAAAAAAAAH//////////v////8AAAAAAAAAAA/z//////////////////////////////2AADAAAAA","AAAAAAAAAAAD///////////////MAAAAAAAAAAA/v//////////////////////////////3AAAAAAAA","AAAAAAAAAAAP//////////////+YAAAAAAAAAAB8P//////////////////////////////3AAAAAAAA","AAAAAAAAAAAH/////////////iQcAAAAAAAAAABAf//////////////////////////////3AAAAAAAA","AAAAAAAAAAAB/////////////jg/AAAAAAAAAAAH///////////////////////////////ngAAAAAAA","AAAAAAAAAAAA////////////+cw/gAAAAAAAAAAH///////////////////////////////mgAAAAAAA","AAAAAAAAAAAAf///////////98B/wAAAAAAAAAA////////////////////////////////mAAAAAAAA","AAAAAAAAAAAAP////////////8B/wAAAAAAAAAA////////////////////////////////GAAAAAAAA","AAAAAAAAAAAAP////////////8B/wAAAAAAAAAAP///////////////////////////////GAAAAAAAA","AAAAAAAAAAAAP////////////8AGwAAAAAAAAAAH//////////////////////////////+GAAAAAAAA","AAAAAAAAAAAAP/////////////sAgAAAAAAAAAAD//////+/P//j//////////////////+HAAAAAAAA","AAAAAAAAAAAAH/////////////8AAAAAAAAAAAAD//////+OP/+B//////////////////8EAAAAAAAA","AAAAAAAAAAAAH/////////////8AAAAAAAAAAAAD//+///8f//8H//////////////////4EAAAAAAAA","AAAAAAAAAAAAP////////////nwAAAAAAAAAAAAD//+///8Pf/4P//////////////////wGAAAAAAAA","AAAAAAAAAAAAP////////////OAAAAAAAAAAAAAD//+P//4EP/4f//////////////////wHAAAAAAAA","AAAAAAAAAAAAP///////////8MAAAAAAAAAAAAAD/+fP//wAD/4P//////////////////gPwAAAAAAA","AAAAAAAAAAAAP///////////wAAAAAAAAAAAAA///4Pj//wAB/8P//////////////////AfwAAAAAAA","AAAAAAAAAAAAP///////////wAAAAAAAAAAAAB//8Avh//gAAf8H/////////////////0A/AAAAAAAA","AAAAAAAAAAAAP///////////wAAAAAAAAAAAAA//8Bnwf/gAAf+D/////////////////gA6AAAAAAAA","AAAAAAAAAAAAP///////////4AAAAAAAAAAAAA//8Bj8P/wfAf+C////////////////+AAwAAAAAAAA","AAAAAAAAAAAAP///////////AAAAAAAAAAAAAA//4Ah+P///7//A////////////////+AAYAAAAAAAA","AAAAAAAAAAAAP//////////+AAAAAAAAAAAAAA//gBgfvz/////j//////////////+/+AA4AAAAAAAA","AAAAAAAAAAAAP//////////8AAAAAAAAAAAAAA//ABgMvx/////j//////////////8/4AA4AAAAAAAA","AAAAAAAAAAAAH//////////4AAAAAAAAAAAAAB//ABgGHh/////B//////////////4xwAA4AAAAAAAA","AAAAAAAAAAAAH//////////wAAAAAAAAAAAAAB//AAAGHh/////B//////////////gD4AA4AAAAAAAA","AAAAAAAAAAAAD//////////wAAAAAAAAAAAAAA//AAAcDx/////B//////////////gD8AAwAAAAAAAA","AAAAAAAAAAAAD//////////gAAAAAAAAAAAAAA/+AAD4Dw/////B//////////////7B8ADwAAAAAAAA","AAAAAAAAAAAAB//////////gAAAAAAAAAAAAAA/8AP44Dg/////x///////////////w+APwAAAAAAAA","AAAAAAAAAAAAB//////////gAAAAAAAAAAAAAAHA//4ABgO9//////////////////+A+AfwAAAAAAAA","AAAAAAAAAAAAA//////////gAAAAAAAAAAAAAACD//4QAAAA//////////////////+A+BfwAAAAAAAA","AAAAAAAAAAAAAf/////////gAAAAAAAAAAAAAAH///4AAeAc//////////////////4A+P/gAAAAAAAA","AAAAAAAAAAAAAf/////////AAAAAAAAAAAAAAAH///wAAAAZ//////////////////8A4f/AAAAAAAAA","AAAAAAAAAAAAAH////////8AAAAAAAAAAAAAAAP///wAAAAB//////////////////+AA/wAAAAAAAAA","AAAAAAAAAAAAAB////////4AAAAAAAAAAAAAAA////4AAAAB//////////////////+AB+AAAAAAAAAA","AAAAAAAAAAAAAB////////wAAAAAAAAAAAAAAA/////gDgAD///////////////////AB8AAAAAAAAAA","AAAAAAAAAAAAAA////////gAAAAAAAAAAAAAAB/////4PwAD///////////////////AAwAAAAAAAAAA","AAAAAAAAAAAAAA////////AAAAAAAAAAAAAAAB/////4P/jj///////////////////gBgAAAAAAAAAA","AAAAAAAAAAAAAAZ///////AAAAAAAAAAAAAAAB//////P//////////////////////gAAAAAAAAAAAA","AAAAAAAAAAAAAAd/////1/AAAAAAAAAAAAAAAB/////////////////////////////AAAAAAAAAAAAA","AAAAAAAAAAAAAAM////rgHAAAAAAAAAAAAAAAD////////////8f///////////////gAAAAAAAAAAAA","AAAAAAAAAAAAAAG///+AAHgAAAAAAAAAAAAAAH////////////+P///////////////gAAAAAAAAAAAA","AAAAAAAAAAAAAAHf//4AAHgAAAAAAAAAAAAAAf////////////+P///////////////AAAAAAAAAAAAA","AAAAAAAAAAAAAAHP//4AAHgAAAAAAAAAAAAAA//////////5///D//////////////+AAAAAAAAAAAAA","AAAAAAAAAAAAAADn//wAAD2AAAAAAAAAAAAAA//////////4///h//////////////+AAAAAAAAAAAAA","AAAAAAAAAAAAAABz//4AABhAAAAAAAAAAAAAD//////////8///gH/////////////8AAAAAAAAAAAAA","AAAAAAAAAAAAAAAz//4AABgAAAAAAAAAAAAAD//////////8f//4I/////////////4AAAAAAAAAAAAA","AAAAAAAAAAAAAAA4//wAAAGAAAAAAAAAAAAAD//////////+f//4cAB///////////5gAAAAAAAAAAAA","AAAAAAAAAAAAAAAc//wAAACAAAAAAAAAAAAAH///////////P///8AB///////////zgAAAAAAAAAAAA","AAAAAAAAAAAAAAAMf/wAAAAAAAAAAAAAAAAAP///////////H////gAf//////////jAAAAAAAAAAAAA","AAAAAAAAAAAAAAAEP/wAAPwAAAAAAAAAAAAAP///////////D////wAP/////////+DAAAAAAAAAAAAA","AAAAEAAAAAAAAAAAH/wAAZ+AAAAAAAAAAAAAf///////////j////wAP////v////gAAAAAAAAAAAAAA","AAAABgAAAAAAAAAAH/wA8AHgAAAAAAAAAAAAf///////////z////gAH///wP///OAAAAAAAAAAAAAAA","AAAAAQAAAAAAAAAAH/4B8AD4AAAAAAAAAAAAf///////////z////AACf//wH//+MAAAAAAAAAAAAAAA","AAAAAMAAAAAAAAAAH/8B8AD7wAAAAAAAAAAAP///////////w///+AAAf//gD//8cAAAAAAAAAAAAAAA","AAAAAMAAAAAAAAAAD/8D8AAB8AAAAAAAAAAAP///////////w///+AAAf/+AB//4cAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAAB//f4ADH+4AAAAAAAAAAP///////////wf//8AAAf/+AB//8YABgAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAf//4ADAgwAAAAAAAAAAP///////////4f//4AAAf/4AA//8AADgAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAH//4AAAAAAAAAAAAAAAP///////////8P//wAAAf/wAA//+AADwAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAA//wAAAAAAAAAAAAAAAP///////////8H/+AAAAP/wAB7//AADgAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAEf/wAAAAAAAAAAAAAAf///////////+H/8AAAAP+AAAj//gADAAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAP/4AAAAAAAAAAAAAAf////////////H/wAAAAH+AAAD//wADAAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAH/4AAAAAAAAAAAAAAf////////////3/AAAAAH+AAAD//wAD4AAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAA/4AAAAAAAAAAAAAAf/////////////4AAAAAH+AAAB//wAD8AAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAH4AAAAAAAAAAAAAAf/////////////AAAAAAD+AAAB//wABMAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAD4ABoAAAAAAAAAAAP////////////8AQAAAAD+AAABz/wAADAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAB4AH+AAAAAAAAAAAH////////////8HwAAAAB+AAABh/gAE3AAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAB4Af/z4AAAAAAAAAD//////////////wAAAAB+AAABg/AAM+AAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAA8Aff/4AAAAAAAAAB//////////////wAAAAB8AAABAOAAIYAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAP+///4AAAAAAAAAA//////////////wAAAAA/AAABgYAAQTgAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAP3///+AAAAAAAAAA//////////////gAAAAATgAABwAAAAfgAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAABn////AAAAAAAAAAf/////////////gAAAAADgAAAwAAAAfgAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAD////gAAAAAAAAAP/////////////AAAAAADgAAAcAABgHgAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAD////2AAAAAAAAAH/////////////AAAAAABgAAAeAADgDAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAD/////wAAAAAAAAB//Af////////+AAAAAAAAAAcfAAH4AAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAD/////4AAAAAAAAA8EAf////////8AAAAAAAAAAePAAPwAAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAB/////8AAAAAAAAAAAAA////////8AAAAAAAAAAPPAAfgAAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAD/////8AAAAAAAAAAAAAf///////4AAAAAAAAAADnAA/gAAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAH/////+AAAAAAAAAAAAAf///////wAAAAAAAAAAD3gD/gAAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAH//////AAAAAAAAAAAAA////////AAAAAAAAAAAB/gf/wCIAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAf/////+AAAAAAAAAAAAA///////+AAAAAAAAAAAA+Af/7+MAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAf/////+AAAAAAAAAAAAA///////8AAAAAAAAAAAA/gf/iIIAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAA///////4AAAAAAAAAAAA///////4AAAAAAAAAAAAfAf/mYIeAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAA////////AAAAAAAAAAAA///////wAAAAAAAAAAAAPwP/HwA+AAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAA////////gAAAAAAAAAAA///////gAAAAAAAAAAAAPwH/PgAOfAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAf////////gAAAAAAAAAAf//////AAAAAAAAAAAAAH8H/PgHPf8AGAAAAAA","AAAAAAAAAAAAAAAAAAAAAA/////////4AAAAAAAAAAP//////AAAAAAAAAAAAAD8BOHwxH//gBAAAAAA","AAAAAAAAAAAAAAAAAAAAAB/////////8AAAAAAAAAAH/////+AAAAAAAAAAAAAB4AAGwAB//wDAAAAAA","AAAAAAAAAAAAAAAAAAAAAB//////////gAAAAAAAAAD/////8AAAAAAAAAAAAAA4AAGQAAH/4GAAAAAA","AAAAAAAAAAAAAAAAAAAAAA//////////wAAAAAAAAAD/////8AAAAAAAAAAAAAAeAAAAABD/+8IAAAAA","AAAAAAAAAAAAAAAAAAAAAA//////////wAAAAAAAAAD/////8AAAAAAAAAAAAAAPmAAAAAD/+AGAAAAA","AAAAAAAAAAAAAAAAAAAAAAP/////////wAAAAAAAAAB/////+AAAAAAAAAAAAAAD/gAAAAD/+ABQAAAA","AAAAAAAAAAAAAAAAAAAAAAP/////////wAAAAAAAAAB/////+AAAAAAAAAAAAAAAH8SQQAH/PAAKAAAA","AAAAAAAAAAAAAAAAAAAAAAH/////////gAAAAAAAAAB/////+AAAAAAAAAAAAAAAAI7jgAAeHgACAAAA","AAAAAAAAAAAAAAAAAAAAAAH/////////gAAAAAAAAAB/////+AAAAAAAAAAAAAAAAAGGAAAADwAHAAAA","AAAAAAAAAAAAAAAAAAAAAAD/////////AAAAAAAAAAA//////AAAAAAAAAAAAAAAAACAAAAAA4ABAAAA","AAAAAAAAAAAAAAAAAAAAAAD////////+AAAAAAAAAAA//////AAAAAAAAAAAAAAAAAAAAIAGAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAB////////8AAAAAAAAAAA//////AAAAAAAAAAAAAAAAAAAAPQGAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAB////////8AAAAAAAAAAB//////ABAAAAAAAAAAAAAAAAAA/4GAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAA////////4AAAAAAAAAAB//////ABgAAAAAAAAAAAAAAAAB/wPAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAA////////wAAAAAAAAAAD//////ADgAAAAAAAAAAAAAAAAx/wPAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAA////////wAAAAAAAAAAD//////gHgAAAAAAAAAAAAAAAB//gHwAAAAgAA","AAAAAAAAAAAAAAAAAAAAAAAP///////wAAAAAAAAAAH//////AfwAAAAAAAAAAAAAAAD//wPwAAAAgAA","gAAAAAAAAAAAAAAAAAAAAAAH///////wAAAAAAAAAAH//////B/gAAAAAAAAAAAAAAAH//8PwAAAAQAB","AAAAAAAAAAAAAAAAAAAAAAAB///////wAAAAAAAAAAH/////8B/AAAAAAAAAAAAAAAAf//+P4AAAAAAC","AAAAAAAAAAAAAAAAAAAAAAAAf//////wAAAAAAAAAAH/////wD/AAAAAAAAAAAAAAAAf////4AAAAAAO","AAAAAAAAAAAAAAAAAAAAAAAAP//////wAAAAAAAAAAD/////gD/AAAAAAAAAAAAAAAA/////4AAAAAAE","AAAAAAAAAAAAAAAAAAAAAAAAP//////gAAAAAAAAAAB/////AB/AAAAAAAAAAAAAAAA/////8AAAAAAA","AAAAAAAAAAAAAAAAAAAAAAAAP//////gAAAAAAAAAAB////+AB+AAAAAAAAAAAAAAAH//////AAAAAAA","AAAAAAAAAAAAAAAAAAAAAAAAP//////AAAAAAAAAAAB////+AB+AAAAAAAAAAAAAAA///////gAAGAAA","AAAAAAAAAAAAAAAAAAAAAAAAP//////AAAAAAAAAAAA////+AD+AAAAAAAAAAAAAAD///////gAADAAA","AAAAAAAAAAAAAAAAAAAAAAAAP//////AAAAAAAAAAAA/////AH8AAAAAAAAAAAAAAP///////wAABgAA","AAAAAAAAAAAAAAAAAAAAAAAAP/////+AAAAAAAAAAAAf////AH8AAAAAAAAAAAAAAf///////4AAAAAA","AAAAAAAAAAAAAAAAAAAAAAAAP/////wAAAAAAAAAAAAf////AD8AAAAAAAAAAAAAAf///////4AAAAAA","AAAAAAAAAAAAAAAAAAAAAAAAP/////AAAAAAAAAAAAAf////AD8AAAAAAAAAAAAAAf///////8AAAAAA","AAAAAAAAAAAAAAAAAAAAAAAAP////4AAAAAAAAAAAAAf///+AD4AAAAAAAAAAAAAAf////////AAAAAA","AAAAAAAAAAAAAAAAAAAAAAAAf////wAAAAAAAAAAAAAf///4ABwAAAAAAAAAAAAAAP////////AAAAAA","AAAAAAAAAAAAAAAAAAAAAAAAf////wAAAAAAAAAAAAAP///wAAAAAAAAAAAAAAAAAf////////AAAAAA","AAAAAAAAAAAAAAAAAAAAAAAAf////wAAAAAAAAAAAAAP///wAAAAAAAAAAAAAAAAAf////////AAAAAA","AAAAAAAAAAAAAAAAAAAAAAAAf////wAAAAAAAAAAAAAP///wAAAAAAAAAAAAAAAAAP////////gAAAAA","AAAAAAAAAAAAAAAAAAAAAAAAf////gAAAAAAAAAAAAAH///wAAAAAAAAAAAAAAAAAP////////gAAAAA","AAAAAAAAAAAAAAAAAAAAAAAA/////gAAAAAAAAAAAAAD///gAAAAAAAAAAAAAAAAAH////////gAAAAA","AAAAAAAAAAAAAAAAAAAAAAAA/////AAAAAAAAAAAAAAD//nAAAAAAAAAAAAAAAAAAH////////gAAAAA","AAAAAAAAAAAAAAAAAAAAAAAAf////AAAAAAAAAAAAAAB//OAAAAAAAAAAAAAAAAAAH////////gAAAAA","AAAAAAAAAAAAAAAAAAAAAAAA////+AAAAAAAAAAAAAAB//+AAAAAAAAAAAAAAAAAAH////////AAAAAA","AAAAAAAAAAAAAAAAAAAAAAAA////8AAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAD////////AAAAAA","AAAAAAAAAAAAAAAAAAAAAAAA////4AAAAAAAAAAAAAAA//4AAAAAAAAAAAAAAAAAAD//8P////AAAAAA","AAAAAAAAAAAAAAAAAAAAAAAA////wAAAAAAAAAAAAAAA//wAAAAAAAAAAAAAAAAAAD//AD////AAAAAA","AAAAAAAAAAAAAAAAAAAAAAAA////wAAAAAAAAAAAAAAA//gAAAAAAAAAAAAAAAAAAD/8AB///+AAAAAA","AAAAAAAAAAAAAAAAAAAAAAAA////gAAAAAAAAAAAAAAA/+AAAAAAAAAAAAAAAAAAAH/4AA///8AAAAAA","AAAAAAAAAAAAAAAAAAAAAAAA////AAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAAAAD8AAA3//8AAAAIA","AAAAAAAAAAAAAAAAAAAAAAAB///yAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAP//4AAAAMA","AAAAAAAAAAAAAAAAAAAAAAAB///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//4AAAAGA","AAAAAAAAAAAAAAAAAAAAAAAB///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//wAAAACA","AAAAAAAAAAAAAAAAAAAAAAAD///4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//wAAAADg","AAAAAAAAAAAAAAAAAAAAAAAD///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//wAAAABk","AAAAAAAAAAAAAAAAAAAAAAAD///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/AAAAAB8","AAAAAAAAAAAAAAAAAAAAAAAD///AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADcAAAAAD8","AAAAAAAAAAAAAAAAAAAAAAAD//gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4","AAAAAAAAAAAAAAAAAAAAAAAD//gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADw","AAAAAAAAAAAAAAAAAAAAAAAH//gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABw","AAAAAAAAAAAAAAAAAAAAAAAH//gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfAAAAAdg","AAAAAAAAAAAAAAAAAAAAAAAH/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfAAAAAfg","AAAAAAAAAAAAAAAAAAAAAAAH/+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfAAAAA8A","AAAAAAAAAAAAAAAAAAAAAAAF/+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAAAAA8A","AAAAAAAAAAAAAAAAAAAAAAAF/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAB4A","AAAAAAAAAAAAAAAAAAAAAAAD/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAH4A","AAAAAAAAAAAAAAAAAAAAAAAH/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgA","AAAAAAAAAAAAAAAAAAAAAAAP/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfgA","AAAAAAAAAAAAAAAAAAAAAAAP/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/AA","AAAAAAAAAAAAAAAAAAAAAAAP/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/AA","AAAAAAAAAAAAAAAAAAAAAAAf/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeAA","AAAAAAAAAAAAAAAAAAAAAAAP/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAAP/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAAf/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAAf/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAAf/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAAf/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAAf/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAAf+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAAP8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAAP8ADgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAAf+APgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAAP+AEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAAH+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAAH+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAAH/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAAD/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAAAf4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"]};

/* tigOS pets: art only. Behaviour lives in app.js, motion in styles.css. 120x120 viewBox, ground line at y~108.
   Part classes the animations hook into: head, eyes, lids (blink cover, must match the fur colour under it), earL/earR,
   legA/legB, tail, tongue, flipL/flipR, wingL/wingR, ant, core, jets, glow, eyesHappy. */
window.TIG_PETS = {
  cat: { name:'Goob', label:'cat', say:['meow', 'mrrp', 'purr'], svg:
    '<svg viewBox="0 0 120 120">'+
    '<g class="tail"><path d="M86 94 C106 96 112 76 100 64 C95 60 90 64 93 70" fill="none" stroke="#e0862f" stroke-width="10" stroke-linecap="round"/><path d="M86 94 C106 96 112 76 100 64" fill="none" stroke="#c96f22" stroke-width="10" stroke-linecap="round" stroke-dasharray="5 11" opacity=".5"/></g>'+
    '<ellipse cx="60" cy="84" rx="31" ry="25" fill="#f2a24d"/><path d="M34 76 q6 -4 12 0 M74 76 q6 -4 12 0 M40 92 q6 -4 12 0 M70 92 q6 -4 12 0" stroke="#c96f22" stroke-width="3.2" stroke-linecap="round" fill="none"/>'+
    '<ellipse cx="60" cy="92" rx="18" ry="14" fill="#ffe8cf"/>'+
    '<g class="legA"><ellipse cx="46" cy="106" rx="11" ry="6.5" fill="#f2a24d"/><path d="M42 106v3M46 106v3M50 106v3" stroke="#c96f22" stroke-width="1.6" stroke-linecap="round"/></g>'+
    '<g class="legB"><ellipse cx="74" cy="106" rx="11" ry="6.5" fill="#f2a24d"/><path d="M70 106v3M74 106v3M78 106v3" stroke="#c96f22" stroke-width="1.6" stroke-linecap="round"/></g>'+
    '<g class="head">'+
      '<g class="earL"><path d="M34 34 L28 6 L54 22 Z" fill="#f2a24d"/><path d="M37 30 L33 14 L50 24 Z" fill="#ffb7c8"/></g>'+
      '<g class="earR"><path d="M86 34 L92 6 L66 22 Z" fill="#f2a24d"/><path d="M83 30 L87 14 L70 24 Z" fill="#ffb7c8"/></g>'+
      '<circle cx="60" cy="46" r="29" fill="#f2a24d"/><path d="M50 20 q3 6 0 12 M60 18 q0 7 0 12 M70 20 q-3 6 0 12" stroke="#c96f22" stroke-width="3" stroke-linecap="round" fill="none"/>'+
      '<ellipse cx="60" cy="58" rx="20" ry="13" fill="#ffe8cf"/>'+
      '<circle cx="40" cy="54" r="5" fill="#ff9ab3" opacity=".55"/><circle cx="80" cy="54" r="5" fill="#ff9ab3" opacity=".55"/>'+
      '<g class="eyes"><ellipse cx="49" cy="46" rx="5.6" ry="6.8" fill="#2e2740"/><ellipse cx="71" cy="46" rx="5.6" ry="6.8" fill="#2e2740"/><ellipse cx="49" cy="46.5" rx="3.2" ry="4.4" fill="#4b8f6a"/><ellipse cx="71" cy="46.5" rx="3.2" ry="4.4" fill="#4b8f6a"/><ellipse cx="49" cy="47" rx="1.6" ry="3.6" fill="#1a1626"/><ellipse cx="71" cy="47" rx="1.6" ry="3.6" fill="#1a1626"/><circle cx="51" cy="43.5" r="1.9" fill="#fff"/><circle cx="73" cy="43.5" r="1.9" fill="#fff"/></g>'+
      '<g class="lids"><rect x="42.5" y="38.5" width="13" height="15.5" rx="6.5" fill="#f2a24d"/><rect x="64.5" y="38.5" width="13" height="15.5" rx="6.5" fill="#f2a24d"/></g>'+
      '<path d="M60 54 l3.4 3 h-6.8 z" fill="#ff8fab"/><path d="M60 57 v3 M56.5 60 q3.5 3.4 7 0" stroke="#7a4b2a" stroke-width="1.6" fill="none" stroke-linecap="round"/>'+
      '<path d="M36 52 h-14 M36 57 h-15 M84 52 h14 M84 57 h15" stroke="#f7dcc0" stroke-width="1.6" stroke-linecap="round"/>'+
    '</g></svg>' },

  dog: { name:'Khlo\u00e9', label:'German shepherd', say:['woof!', 'woof woof', 'arf'], svg:
    '<svg viewBox="0 0 120 120">'+
    '<g class="tail"><path d="M88 86 C100 90 108 98 106 108" fill="none" stroke="#1c1a1d" stroke-width="10" stroke-linecap="round"/><path d="M104 102 C106 105 106 108 106 108" fill="none" stroke="#9a5a26" stroke-width="7" stroke-linecap="round"/></g>'+
    '<ellipse cx="60" cy="84" rx="32" ry="25" fill="#9a5a26"/>'+
    '<path d="M28 84 C30 56 90 56 92 84 C84 68 36 68 28 84 Z" fill="#1c1a1d"/>'+
    '<ellipse cx="60" cy="94" rx="17" ry="12" fill="#c9985e"/>'+
    '<g class="legA"><rect x="36" y="92" width="13" height="16" rx="6" fill="#9a5a26"/><ellipse cx="42.5" cy="107" rx="9" ry="5" fill="#8a4f20"/><path d="M39 107v3M42.5 107v3M46 107v3" stroke="#3b2210" stroke-width="1.5" stroke-linecap="round"/></g>'+
    '<g class="legB"><rect x="71" y="92" width="13" height="16" rx="6" fill="#9a5a26"/><ellipse cx="77.5" cy="107" rx="9" ry="5" fill="#8a4f20"/><path d="M74 107v3M77.5 107v3M81 107v3" stroke="#3b2210" stroke-width="1.5" stroke-linecap="round"/></g>'+
    '<g class="head">'+
      '<g class="earL"><path d="M34 36 L24 2 L58 22 Z" fill="#1c1a1d"/><path d="M37 32 L31 12 L50 24 Z" fill="#9a5a26"/></g>'+
      '<g class="earR"><path d="M86 36 L96 2 L62 22 Z" fill="#1c1a1d"/><path d="M83 32 L89 12 L70 24 Z" fill="#9a5a26"/></g>'+
      '<circle cx="60" cy="46" r="28" fill="#9a5a26"/>'+
      '<path d="M32 44 C34 18 86 18 88 44 C82 30 70 27 60 28 C50 27 38 30 32 44 Z" fill="#1c1a1d"/>'+
      '<path d="M45 34 q5 -3 10 0 M65 34 q5 -3 10 0" stroke="#d9a066" stroke-width="3" stroke-linecap="round" fill="none"/>'+
      '<path d="M44 58 C46 48 74 48 76 58 C76 68 68 74 60 74 C52 74 44 68 44 58 Z" fill="#1c1a1d"/>'+
      '<ellipse cx="60" cy="63" rx="12" ry="8" fill="#3b2a20"/>'+
      '<ellipse cx="60" cy="57" rx="7" ry="5" fill="#0a0808"/><ellipse cx="57.5" cy="55.5" rx="1.9" ry="1.2" fill="#fff" opacity=".65"/>'+
      '<path d="M60 61 v3.5 M54.5 64.5 q5.5 4.5 11 0" stroke="#0a0808" stroke-width="1.7" fill="none" stroke-linecap="round"/>'+
      '<g class="tongue"><path d="M57 67 q3 8 6 0 v-2 h-6 z" fill="#ff7f9e"/><path d="M60 67 v5" stroke="#e85c80" stroke-width="1"/></g>'+
      '<g class="eyes"><ellipse cx="48.5" cy="45" rx="5.2" ry="6.2" fill="#2a1a10"/><ellipse cx="71.5" cy="45" rx="5.2" ry="6.2" fill="#2a1a10"/><ellipse cx="48.5" cy="45.6" rx="3.1" ry="4" fill="#8a4a1c"/><ellipse cx="71.5" cy="45.6" rx="3.1" ry="4" fill="#8a4a1c"/><ellipse cx="48.5" cy="46" rx="1.7" ry="3.2" fill="#0d0a08"/><ellipse cx="71.5" cy="46" rx="1.7" ry="3.2" fill="#0d0a08"/><circle cx="50.5" cy="42.5" r="1.9" fill="#fff"/><circle cx="73.5" cy="42.5" r="1.9" fill="#fff"/></g>'+
      '<g class="lids"><rect x="42.5" y="38" width="12" height="14.5" rx="6" fill="#9a5a26"/><rect x="65.5" y="38" width="12" height="14.5" rx="6" fill="#9a5a26"/></g>'+
    '</g>'+
    '<path d="M40 66 C46 72 74 72 80 66 L80 72 C74 78 46 78 40 72 Z" fill="#ff7fb0"/><circle cx="60" cy="76" r="4" fill="#f5c451"/><circle cx="60" cy="76" r="1.6" fill="#b8860b"/>'+
    '</svg>' },

  cow: { name:'Moo', label:'cow', say:['moo', 'mooo', 'hm?'], svg:
    '<svg viewBox="0 0 120 120">'+
    '<g class="tail"><path d="M90 74 C104 78 106 92 100 102" fill="none" stroke="#fbf8f2" stroke-width="6" stroke-linecap="round"/><ellipse cx="100" cy="104" rx="5" ry="6" fill="#23201f"/></g>'+
    '<g class="legA"><rect x="35" y="84" width="12" height="22" rx="5" fill="#fbf8f2"/><rect x="35" y="101" width="12" height="7" rx="3" fill="#23201f"/><rect x="63" y="86" width="12" height="20" rx="5" fill="#fbf8f2"/><rect x="63" y="101" width="12" height="7" rx="3" fill="#23201f"/></g>'+
    '<g class="legB"><rect x="49" y="86" width="12" height="20" rx="5" fill="#fbf8f2"/><rect x="49" y="101" width="12" height="7" rx="3" fill="#23201f"/><rect x="77" y="84" width="12" height="22" rx="5" fill="#fbf8f2"/><rect x="77" y="101" width="12" height="7" rx="3" fill="#23201f"/></g>'+
    '<ellipse cx="60" cy="72" rx="33" ry="22" fill="#fbf8f2"/>'+
    '<path d="M29 70 C31 56 48 56 48 66 C47 78 31 82 29 70 Z" fill="#23201f"/><path d="M92 78 C90 64 74 66 72 76 C74 88 90 92 92 78 Z" fill="#23201f"/><path d="M56 84 C62 78 72 82 70 90 C64 92 56 92 56 84 Z" fill="#23201f"/>'+
    '<ellipse cx="60" cy="88" rx="14" ry="7" fill="#f6b4c2"/><circle cx="55" cy="90" r="1.6" fill="#d9879a"/><circle cx="60" cy="91" r="1.6" fill="#d9879a"/><circle cx="65" cy="90" r="1.6" fill="#d9879a"/>'+
    '<g class="head">'+
      '<path d="M46 26 C38 20 36 10 41 5 C47 10 50 18 50 26 Z" fill="#e9dcc2"/><path d="M74 26 C82 20 84 10 79 5 C73 10 70 18 70 26 Z" fill="#e9dcc2"/>'+
      '<g class="earL"><ellipse cx="33" cy="34" rx="11" ry="6.5" fill="#fbf8f2" class="abs" transform="rotate(-22 33 34)"/><ellipse cx="33" cy="34" rx="6.5" ry="3.5" fill="#f6b4c2" class="abs" transform="rotate(-22 33 34)"/></g>'+
      '<g class="earR"><ellipse cx="87" cy="34" rx="11" ry="6.5" fill="#fbf8f2" class="abs" transform="rotate(22 87 34)"/><ellipse cx="87" cy="34" rx="6.5" ry="3.5" fill="#f6b4c2" class="abs" transform="rotate(22 87 34)"/></g>'+
      '<circle cx="60" cy="40" r="24" fill="#fbf8f2"/>'+
      '<path d="M36 34 C40 18 58 18 59 32 C58 44 40 46 36 34 Z" fill="#23201f"/>'+
      '<ellipse cx="60" cy="53" rx="16" ry="9.5" fill="#f6b4c2"/><ellipse cx="53.5" cy="53" rx="2.4" ry="3" fill="#d9879a"/><ellipse cx="66.5" cy="53" rx="2.4" ry="3" fill="#d9879a"/>'+
      '<path d="M53 59 q7 4 14 0" stroke="#c9788c" stroke-width="1.5" fill="none" stroke-linecap="round"/>'+
      '<g class="eyes"><ellipse cx="48" cy="37" rx="4.8" ry="5.8" fill="#fff"/><ellipse cx="72" cy="37" rx="4.8" ry="5.8" fill="#23201f"/><ellipse cx="48.5" cy="37.5" rx="3.2" ry="4.2" fill="#23201f"/><circle cx="50" cy="35" r="1.6" fill="#fff"/><circle cx="74" cy="35" r="1.6" fill="#fff"/></g>'+
      '<g class="lids"><rect x="42.5" y="30.5" width="11" height="13" rx="5.5" fill="#23201f"/><rect x="66.5" y="30.5" width="11" height="13" rx="5.5" fill="#fbf8f2"/></g>'+
      '<circle cx="44" cy="47" r="3.6" fill="#ff9ab3" opacity=".5"/><circle cx="76" cy="47" r="3.6" fill="#ff9ab3" opacity=".5"/>'+
    '</g>'+
    '<path d="M44 58 C50 66 70 66 76 58 L76 63 C70 71 50 71 44 63 Z" fill="#7a4b2a"/><path d="M56 66 h8 l1.5 6 h-11 z" fill="#f5c451"/><circle cx="60" cy="73.5" r="1.5" fill="#7a4b2a"/>'+
    '</svg>' },

  penguin: { name:'Pip', label:'penguin', say:['squawk', 'brr', 'fish?'], svg:
    '<svg viewBox="0 0 120 120">'+
    '<g class="legA"><path d="M40 104 q-8 4 -3 7 h13 q4 -3 -2 -7z" fill="#f59e0b"/><path d="M40 108 h10" stroke="#d97706" stroke-width="1.4" stroke-linecap="round"/></g>'+
    '<g class="legB"><path d="M80 104 q8 4 3 7 h-13 q-4 -3 2 -7z" fill="#f59e0b"/><path d="M70 108 h10" stroke="#d97706" stroke-width="1.4" stroke-linecap="round"/></g>'+
    '<path d="M30 70 C30 44 38 26 60 22 C82 26 90 44 90 70 C90 92 78 106 60 106 C42 106 30 92 30 70 Z" fill="#242a3d"/>'+
    '<g class="flipL"><path d="M31 62 C18 70 20 88 30 96 C36 92 36 74 34 62 Z" fill="#1b2031"/></g>'+
    '<g class="flipR"><path d="M89 62 C102 70 100 88 90 96 C84 92 84 74 86 62 Z" fill="#1b2031"/></g>'+
    '<path d="M40 74 C40 58 80 58 80 74 C80 92 72 102 60 102 C48 102 40 92 40 74 Z" fill="#fbfbf7"/>'+
    '<g class="head">'+
      '<path d="M38 46 C38 28 46 20 60 20 C74 20 82 28 82 46 C82 56 74 60 60 62 C46 60 38 56 38 46 Z" fill="#242a3d"/>'+
      '<path d="M43 46 C43 32 50 28 60 30 C70 28 77 32 77 46 C77 55 70 58 60 59 C50 58 43 55 43 46 Z" fill="#fbfbf7"/>'+
      '<g class="eyes"><ellipse cx="51.5" cy="42" rx="4.6" ry="5.6" fill="#161a28"/><ellipse cx="68.5" cy="42" rx="4.6" ry="5.6" fill="#161a28"/><circle cx="53.3" cy="40" r="1.7" fill="#fff"/><circle cx="70.3" cy="40" r="1.7" fill="#fff"/></g>'+
      '<g class="lids"><rect x="46" y="35.5" width="11" height="13.5" rx="5.5" fill="#fbfbf7"/><rect x="63" y="35.5" width="11" height="13.5" rx="5.5" fill="#fbfbf7"/></g>'+
      '<path d="M60 48 l8 5 -8 6 -8 -6 z" fill="#f59e0b"/><path d="M52 53 l8 6 8 -6" fill="none" stroke="#d97706" stroke-width="1.4"/>'+
      '<circle cx="46" cy="50" r="3.8" fill="#ff9ab3" opacity=".5"/><circle cx="74" cy="50" r="3.8" fill="#ff9ab3" opacity=".5"/>'+
    '</g>'+
    '<path d="M38 62 C48 70 72 70 82 62 C78 68 74 70 72 70 L70 84 C66 86 62 84 62 82 L64 70 C52 70 46 68 38 62 Z" fill="#e5484d"/><path d="M62 74 h8" stroke="#c73a3f" stroke-width="1.6" stroke-linecap="round"/>'+
    '</svg>' },

  ladybug: { name:'Hailey', label:'ladybug', say:['\u2665', 'hi!', 'tee hee'], svg:
    '<svg viewBox="0 0 120 120">'+
    '<g class="legA"><path d="M36 66 L20 56 M38 78 L20 82 M44 90 L34 104" stroke="#1d1d22" stroke-width="3.6" stroke-linecap="round" fill="none"/></g>'+
    '<g class="legB"><path d="M84 66 L100 56 M82 78 L100 82 M76 90 L86 104" stroke="#1d1d22" stroke-width="3.6" stroke-linecap="round" fill="none"/></g>'+
    '<ellipse cx="60" cy="70" rx="28" ry="25" fill="#2a2a30"/>'+
    '<g class="wingL"><path d="M60 46 C40 46 30 60 32 78 C36 92 50 96 60 96 Z" fill="#e5303f"/><circle cx="46" cy="62" r="4.6" fill="#1d1d22"/><circle cx="42" cy="80" r="4" fill="#1d1d22"/><circle cx="54" cy="86" r="3.2" fill="#1d1d22"/><path d="M52 50 C44 52 38 58 36 66" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".28"/></g>'+
    '<g class="wingR"><path d="M60 46 C80 46 90 60 88 78 C84 92 70 96 60 96 Z" fill="#e5303f"/><circle cx="74" cy="62" r="4.6" fill="#1d1d22"/><circle cx="78" cy="80" r="4" fill="#1d1d22"/><circle cx="66" cy="86" r="3.2" fill="#1d1d22"/></g>'+
    '<path d="M60 47 v49" stroke="#1d1d22" stroke-width="2.4"/>'+
    '<g class="head">'+
      '<path d="M50 30 C46 22 40 18 36 16 M70 30 C74 22 80 18 84 16" stroke="#1d1d22" stroke-width="2.6" stroke-linecap="round" fill="none"/><circle cx="35" cy="15" r="3" fill="#1d1d22"/><circle cx="85" cy="15" r="3" fill="#1d1d22"/>'+
      '<circle cx="60" cy="40" r="15" fill="#1d1d22"/>'+
      '<ellipse cx="54" cy="33" rx="5" ry="3" fill="#fff" opacity=".18" class="abs" transform="rotate(-25 54 33)"/>'+
    '</g></svg>' },

  aki: { name:'Aki', label:'robot', say:['beep boop', 'hi, chase', '01101000 01101001', 'running diagnostics\u2026 all good', 'need a hand?'], svg:
    '<svg viewBox="0 0 120 120">'+
    '<g class="jets"><ellipse cx="60" cy="108" rx="22" ry="4" fill="#5ff2ff" opacity=".22"/><path class="jet" d="M48 96 q4 12 8 0z" fill="#8ff7ff"/><path class="jet" d="M64 96 q4 12 8 0z" fill="#8ff7ff"/></g>'+
    '<g class="armL"><rect x="27" y="66" width="11" height="22" rx="5.5" fill="#2b2f45" stroke="#454b6e" stroke-width="1.5"/><circle cx="32.5" cy="90" r="5.5" fill="#3a4060" stroke="#5ff2ff" stroke-width="1.2"/></g>'+
    '<g class="armR"><rect x="82" y="66" width="11" height="22" rx="5.5" fill="#2b2f45" stroke="#454b6e" stroke-width="1.5"/><circle cx="87.5" cy="90" r="5.5" fill="#3a4060" stroke="#5ff2ff" stroke-width="1.2"/></g>'+
    '<rect x="38" y="60" width="44" height="38" rx="15" fill="#2b2f45" stroke="#454b6e" stroke-width="1.5"/>'+
    '<rect x="44" y="66" width="32" height="26" rx="10" fill="#222638"/>'+
    '<circle class="core glow" cx="60" cy="77" r="7.5" fill="#5ff2ff"/><circle cx="60" cy="77" r="3.5" fill="#fff" opacity=".85"/>'+
    '<path d="M49 88 h22" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" opacity=".8"/><circle cx="49" cy="88" r="1.6" fill="#a78bfa"/><circle cx="71" cy="88" r="1.6" fill="#a78bfa"/>'+
    '<g class="head">'+
      '<g class="ant"><path d="M60 26 v-12" stroke="#454b6e" stroke-width="2.4" stroke-linecap="round"/><circle class="bulb glow" cx="60" cy="11" r="4" fill="#a78bfa"/></g>'+
      '<g class="earL"><rect x="30" y="38" width="8" height="14" rx="3" fill="#3a4060" stroke="#454b6e" stroke-width="1.2"/><rect x="32" y="42" width="4" height="6" rx="2" fill="#5ff2ff" opacity=".9"/></g>'+
      '<g class="earR"><rect x="82" y="38" width="8" height="14" rx="3" fill="#3a4060" stroke="#454b6e" stroke-width="1.2"/><rect x="84" y="42" width="4" height="6" rx="2" fill="#5ff2ff" opacity=".9"/></g>'+
      '<rect x="36" y="26" width="48" height="36" rx="16" fill="#2b2f45" stroke="#454b6e" stroke-width="1.5"/>'+
      '<rect x="41" y="32" width="38" height="21" rx="10.5" fill="#0e1220"/>'+
      '<path d="M44 36 q14 -4 32 0" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".12"/>'+
      '<g class="eyes"><rect class="glow" x="47" y="39" width="9" height="7" rx="3.5" fill="#5ff2ff"/><rect class="glow" x="64" y="39" width="9" height="7" rx="3.5" fill="#5ff2ff"/><rect x="49" y="40.5" width="3" height="2" rx="1" fill="#fff" opacity=".9"/><rect x="66" y="40.5" width="3" height="2" rx="1" fill="#fff" opacity=".9"/></g>'+
      '<g class="eyesHappy"><path d="M46 45 q5.5 -7 11 0 M63 45 q5.5 -7 11 0" stroke="#5ff2ff" stroke-width="2.6" stroke-linecap="round" fill="none"/></g>'+
      '<g class="lids"><rect x="45" y="37" width="13" height="11" rx="4" fill="#0e1220"/><rect x="62" y="37" width="13" height="11" rx="4" fill="#0e1220"/></g>'+
      '<g class="mouth"><rect x="52" y="56" width="4" height="2.4" rx="1.2" fill="#5ff2ff" opacity=".75"/><rect x="58" y="56" width="4" height="2.4" rx="1.2" fill="#5ff2ff" opacity=".75"/><rect x="64" y="56" width="4" height="2.4" rx="1.2" fill="#5ff2ff" opacity=".75"/></g>'+
    '</g>'+
    '<text x="60" y="95.5" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-size="4.6" font-weight="700" letter-spacing=".6" fill="#8b93b8">AKI</text>'+
    '</svg>' }
};
/* Tig the tiger: the cat's drawing in tiger colours (orange coat, black stripes, amber eyes, cream muzzle) */
window.TIG_PETS.tiger = { name:'Tig', label:'tiger', say:['rawr', 'grr', 'hi, chase', 'tigOS!'], svg: window.TIG_PETS.cat.svg.replace(/#f2a24d/g, '#ff8a00').replace(/#c96f22/g, '#1c1a1d').replace(/#e0862f/g, '#ff8a00').replace(/#ffb7c8/g, '#ffd9b3').replace(/#ffe8cf/g, '#fff3e0').replace(/#4b8f6a/g, '#f5b301').replace(/#ff9ab3/g, '#ffffff') };
window.TIG_UFO = '<svg viewBox="0 0 160 100">'+
  '<g class="ufo-beam"><path d="M58 58 L12 100 H148 L102 58 Z" fill="url(#ufoBeam)"/></g>'+
  '<defs><linearGradient id="ufoBeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fffb0" stop-opacity=".85"/><stop offset="1" stop-color="#8fffb0" stop-opacity="0"/></linearGradient><radialGradient id="ufoDome" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#d9f7ff" stop-opacity=".95"/><stop offset="1" stop-color="#6fc3ff" stop-opacity=".55"/></radialGradient></defs>'+
  '<g class="ufo-ship">'+
    '<ellipse cx="80" cy="52" rx="20" ry="8" fill="#8fffb0" opacity=".55"/>'+
    '<ellipse cx="80" cy="30" rx="26" ry="18" fill="url(#ufoDome)"/><ellipse cx="72" cy="22" rx="8" ry="4" fill="#fff" opacity=".55"/>'+
    '<ellipse cx="80" cy="44" rx="56" ry="14" fill="#5b6280"/><ellipse cx="80" cy="41" rx="56" ry="12" fill="#8a92b8"/><ellipse cx="80" cy="39" rx="46" ry="7" fill="#b9c0e0" opacity=".7"/>'+
    '<g class="ufo-lights"><circle cx="34" cy="46" r="3.2"/><circle cx="52" cy="50" r="3.2"/><circle cx="80" cy="52" r="3.2"/><circle cx="108" cy="50" r="3.2"/><circle cx="126" cy="46" r="3.2"/></g>'+
  '</g></svg>';

window.TIG_ASSETS = {"apple_abe":"assets/apple_abe-74c520ba.webp","apple_story":"assets/apple_story-ab08fad7.webp","eb_banner":"assets/eb_banner-75b8347f.webp","eb_desktop":"assets/eb_desktop-ffaab384.webp","eb_phones":"assets/eb_phones-22b048b3.webp","headshot":"assets/headshot-e073c9c4.webp","hub_email2":"assets/hub_email2-571e2eab.webp","hub_email4":"assets/hub_email4-d939ee7c.webp","hub_packet":"assets/hub_packet-2c59872a.webp","hub_support":"assets/hub_support-a75baba2.webp","jm_email":"assets/jm_email-1cab3011.webp","jm_menu":"assets/jm_menu-054d3d33.webp","jm_photo":"assets/jm_photo-3ae1b18a.webp","resume_pdf":"assets/resume_pdf-dd13bd5c.pdf","resume_preview":"assets/resume_preview-b3284045.webp","three":"assets/three-f9d981f3.js","tig_aleppo":"assets/tig_aleppo-ed307995.webp","tig_mba":"assets/tig_mba-2622ce0c.webp","tig_site":"assets/tig_site-82ca23e5.webp"};
/* tigOS core app.js, part 00: setup. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
(function(){
  'use strict';
  var root = document.getElementById('tigos'); if(!root) return;
  try { if(window.self !== window.top) root.classList.add('framed'); } catch(e){ root.classList.add('framed'); }
  var $ = function(s, c){ return (c||root).querySelector(s); };
  var $$ = function(s, c){ return Array.prototype.slice.call((c||root).querySelectorAll(s)); };
  var isMobile = function(){ return window.matchMedia('(max-width:760px)').matches; };
  var esc = function(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
  var A = window.TIG_ASSETS || {};
  var img = function(key, alt, cls){ return A[key] ? '<img src="'+A[key]+'" alt="'+esc(alt||'')+'" loading="lazy" decoding="async"'+(cls?' class="'+cls+'"':'')+'>' : ''; };
  var ic = function(id){ return '<svg viewBox="0 0 24 24"><use href="#i-'+id+'"/></svg>'; };

/* tigOS core app.js, part 01: apps registry. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------------- apps registry ---------------- */
  var APPS = {
    about:      { title:'About Chase',  icon:'about',      tile:'about',      w:860, h:660 },
    projects:   { title:'Projects',     icon:'projects',   tile:'projects',   w:940, h:700 },
    experience: { title:'Experience',   icon:'exp',        tile:'experience', w:880, h:700 },
    journey:    { title:'Journey',      icon:'journey',    tile:'journey',    w:980, h:660 },
    resume:     { title:'Resume',       icon:'resume',     tile:'resume',     w:980, h:720 },
    skills:     { title:'Skills',       icon:'skills',     tile:'skills',     w:820, h:640 },
    contact:    { title:'Contact',      icon:'contact',    tile:'contact',    w:720, h:620 },
    terminal:   { title:'Terminal',     icon:'terminal',   tile:'terminal',   w:760, h:480 },
    settings:   { title:'Settings',     icon:'gear',       tile:'settings',   w:640, h:600 },
    games:      { title:'Arcade',       icon:'gamepad',    tile:'games',      w:900, h:680, hidden:true },   /* hidden apps: no dock, no default Spotlight list, no ls. The terminal (`game`, `pets`) or a Spotlight search by name opens them */
    pets:       { title:'Pets',         icon:'paw',        tile:'paw',       w:820, h:620, hidden:true }
  };
  var VIS = function(){ return Object.keys(APPS).filter(function(k){ return !APPS[k].hidden; }); };
  var DOCK_ORDER = ['about','projects','experience','journey','resume','skills','contact','terminal'];

/* tigOS core app.js, part 02: toast. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------------- toast ---------------- */
  var toastEl = $('#toast'), toastT;
  function toast(title, sub, icon){
    $('#toastText').textContent = title; $('#toastSub').textContent = sub || '';
    var ti = $('#toastIco'); if(icon){ ti.innerHTML = ic(icon); ti.hidden = false; } else { ti.hidden = true; }
    toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function(){ toastEl.classList.remove('show'); }, 2600);
  }

/* tigOS core app.js, part 03: cities. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------------- cities (time + weather follow the chosen city; New York is home) ---------------- */
  var CITIES = [
    { id:'nyc', name:'New York',     short:'NYC', tz:'America/New_York',    lat:40.7128,  lon:-74.006 },
    { id:'sea', name:'Seattle',      short:'SEA', tz:'America/Los_Angeles', lat:47.6062,  lon:-122.3321 },
    { id:'la',  name:'Los Angeles',  short:'LA',  tz:'America/Los_Angeles', lat:34.0522,  lon:-118.2437 },
    { id:'sf',  name:'San Francisco',short:'SF',  tz:'America/Los_Angeles', lat:37.7749,  lon:-122.4194 },
    { id:'bos', name:'Boston',       short:'BOS', tz:'America/New_York',    lat:42.3601,  lon:-71.0589 },
    { id:'chi', name:'Chicago',      short:'CHI', tz:'America/Chicago',     lat:41.8781,  lon:-87.6298 },
    { id:'aus', name:'Austin',       short:'AUS', tz:'America/Chicago',     lat:30.2672,  lon:-97.7431 },
    { id:'bna', name:'Nashville',    short:'BNA', tz:'America/Chicago',     lat:36.1627,  lon:-86.7816 },
    { id:'den', name:'Denver',       short:'DEN', tz:'America/Denver',      lat:39.7392,  lon:-104.9903 },
    { id:'mia', name:'Miami',        short:'MIA', tz:'America/New_York',    lat:25.7617,  lon:-80.1918 },
    { id:'lon', name:'London',       short:'LDN', tz:'Europe/London',       lat:51.5074,  lon:-0.1278 },
    { id:'tyo', name:'Tokyo',        short:'TYO', tz:'Asia/Tokyo',          lat:35.6762,  lon:139.6503 }
  ];
  var CITY = CITIES[0];
  function cityTime(){
    try { var parts = new Intl.DateTimeFormat('en-US', { timeZone:CITY.tz, hour:'2-digit', minute:'2-digit', hour12:false, weekday:'short', month:'short', day:'numeric' }).formatToParts(new Date()); var g = {}; parts.forEach(function(x){ g[x.type] = x.value; }); return { t:(g.hour === '24' ? '00' : g.hour)+':'+g.minute, d:g.weekday+' '+g.month+' '+g.day }; }
    catch(e){ var d = new Date(), h = d.getHours(), m = d.getMinutes(); return { t:(h<10?'0':'')+h+':'+(m<10?'0':'')+m, d:'' }; }
  }
  function cityHour(){ try { return +new Intl.DateTimeFormat('en-US', { timeZone:CITY.tz, hour:'numeric', hour12:false }).format(new Date()).replace(/^24$/, '0'); } catch(e){ return new Date().getHours(); } }
  function greeting(){ var h = cityHour(); return h < 5 ? { t:'Still up?', s:'It is late in '+CITY.name+'. Picking up where you left off.', i:'moon' } : h < 12 ? { t:'Good morning', s:'Coffee first. Then the portfolio.', i:'coffee' } : h < 17 ? { t:'Good afternoon', s:'Picking up where you left off.' } : { t:'Good evening', s:'Picking up where you left off.', i:'moon' }; }
  function tick(){
    var ct = cityTime();
    var lc = $('#loginClock'); if(lc && !$('#login').hidden) lc.innerHTML = '<small>'+esc(ct.d)+'</small>'+ct.t;
    $('#mbClock').textContent = isMobile() ? ct.t : ct.d+'  '+ct.t;
    var sc = $('#sleepClock'); if(sc && !$('#sleep').hidden){ sc.textContent = ct.t; var sd = $('#sleepDate'); if(sd) sd.textContent = ct.d+' \u00b7 '+CITY.name;
      var sx = $('#sleepWx'); if(sx){ if(WX.now){ sx.innerHTML = ic(WX.now.kind)+'<span>'+WX.now.t+'\u00b0 \u00b7 '+esc(WX.now.label)+'</span>'; sx.hidden = false; } else sx.hidden = true; } }
  }
  tick(); setInterval(tick, 15000);
  function setCity(c){ CITY = c; $('#mbLocName').textContent = c.name; $('#wxCityName').textContent = c.name; tick(); weather(); $$('#cityList button').forEach(function(b){ b.classList.toggle('sel', b.getAttribute('data-city') === c.id); }); }

/* tigOS core app.js, part 04: weather. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------------- weather (Open-Meteo, no key, CORS open; hidden on failure) ---------------- */
  function wxKind(code, day){
    if(code === 0) return day ? 'sun' : 'moon';
    if(code <= 2) return day ? 'partly' : 'moon';
    if(code === 3) return 'cloud';
    if(code === 45 || code === 48) return 'fog';
    if(code >= 95) return 'storm';
    if((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
    return 'rain';
  }
  var WX_LABEL = { sun:'Clear', moon:'Clear night', partly:'Partly cloudy', cloud:'Cloudy', fog:'Fog', rain:'Rain', snow:'Snow', storm:'Thunderstorms' };
  var WX = { days:[] };
  /* one fetch for any city; resolves { now:{kind,t,label}, days:[{d,k,hi,lo}] } or null */
  function wxFetch(c){
    if(!window.fetch) return Promise.resolve(null);
    var url = 'https://api.open-meteo.com/v1/forecast?latitude='+c.lat+'&longitude='+c.lon+'&current=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=4&temperature_unit=fahrenheit&timezone='+encodeURIComponent(c.tz);
    return fetch(url, { mode:'cors' }).then(function(r){ return r.ok ? r.json() : null; }).then(function(j){
      if(!j || !j.current) return null;
      var kind = wxKind(+j.current.weather_code, +j.current.is_day === 1), out = { now:{ kind:kind, t:Math.round(+j.current.temperature_2m), label:WX_LABEL[kind] }, days:[] };
      if(j.daily && j.daily.time){
        var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        for(var i = 1; i < j.daily.time.length && out.days.length < 3; i++){
          var dt = new Date(j.daily.time[i]+'T12:00:00'), k = wxKind(+j.daily.weather_code[i], true);
          out.days.push({ d:(i === 1 ? 'Tmrw' : days[dt.getDay()]), k:k, hi:Math.round(+j.daily.temperature_2m_max[i]), lo:Math.round(+j.daily.temperature_2m_min[i]) });
        }
      }
      return out;
    }).catch(function(){ return null; });
  }
  function weather(){
    var c = CITY;
    wxFetch(c).then(function(w){
      if(!w || c !== CITY) return;
      $('#wxCity').textContent = c.short+' weather';
      var el = $('#mbWx'); el.className = 'mb-wx '+w.now.kind; el.setAttribute('aria-label', w.now.label+' in '+c.name+', '+w.now.t+'\u00b0F. Hover for the 3 day forecast.');
      $('#mbWxIcon').setAttribute('href', '#i-'+w.now.kind); $('#mbWxTemp').textContent = w.now.t+'\u00b0'; el.hidden = false;
      WX.now = w.now; WX.days = w.days;
      $('#wxDays').innerHTML = WX.days.length ? WX.days.map(function(d){ return '<div class="wx-day '+d.k+'"><b>'+d.d+'</b>'+ic(d.k)+'<span class="k">'+WX_LABEL[d.k]+'</span><span class="t">'+d.hi+'\u00b0<i>'+d.lo+'\u00b0</i></span></div>'; }).join('') : '<div class="wx-day"><span class="k">Forecast unavailable</span></div>';
    });
  }
  weather(); setInterval(weather, 15*60*1000);
  var wxEl = $('#mbWx'), wxPop = $('#wxPop'), wxT;
  var wxShown = 0;
  function wxShow(){ clearTimeout(wxT); if(wxEl.hidden) return; if(typeof closePops === 'function') closePops('wx'); wxShown = Date.now(); var r = wxEl.getBoundingClientRect(), rr = root.getBoundingClientRect(); wxPop.style.left = Math.max(8, Math.min(rr.width - 238, r.left - rr.left + r.width/2 - 115))+'px'; wxPop.hidden = false; wxEl.classList.add('on'); }
  function wxHide(){ clearTimeout(wxT); wxT = setTimeout(function(){ wxPop.hidden = true; wxEl.classList.remove('on'); }, 120); }
  wxEl.addEventListener('mouseenter', wxShow); wxEl.addEventListener('mouseleave', wxHide);
  wxPop.addEventListener('mouseenter', function(){ clearTimeout(wxT); }); wxPop.addEventListener('mouseleave', wxHide);
  wxEl.addEventListener('click', function(e){ e.stopPropagation(); if(wxPop.hidden) wxShow(); else if(Date.now() - wxShown > 400){ wxPop.hidden = true; wxEl.classList.remove('on'); } });
  document.addEventListener('click', function(e){ if(!wxPop.hidden && !e.target.closest('#wxPop')){ wxPop.hidden = true; wxEl.classList.remove('on'); } });
  /* city menu */
  function tzAbbr(tz){ try { var parts = new Intl.DateTimeFormat('en-US', { timeZone:tz, timeZoneName:'short' }).formatToParts(new Date()); var z = parts.filter(function(x){ return x.type === 'timeZoneName'; })[0]; return z ? z.value : ''; } catch(e){ return ''; } }
  var cityMenu = $('#cityMenu'), locBtn = $('#mbLoc');
  $('#cityList').innerHTML = CITIES.map(function(c){ return '<button type="button" data-city="'+c.id+'" class="'+(c === CITY ? 'sel' : '')+'">'+esc(c.name)+'<small>'+esc(tzAbbr(c.tz))+'</small></button>'; }).join('');
  var clockBtn = $('#mbClock');
  function cityToggle(force, anchor){
    var show = typeof force === 'boolean' ? force : cityMenu.hidden; cityMenu.hidden = !show;
    var mob = isMobile(); locBtn.classList.toggle('on', show && !mob); clockBtn.classList.toggle('on', show && mob);
    if(show){
      if(typeof closePops === 'function') closePops('city');
      var a = anchor || (mob ? clockBtn : locBtn), r = a.getBoundingClientRect(), rr = root.getBoundingClientRect(), mw = cityMenu.offsetWidth;
      var left = Math.max(8, Math.min(rr.width - mw - 8, r.left - rr.left + r.width/2 - mw/2));
      cityMenu.style.left = left+'px'; cityMenu.style.right = 'auto'; cityMenu.style.setProperty('--caret', (r.left - rr.left + r.width/2 - left)+'px');
    }
  }
  locBtn.addEventListener('click', function(e){ e.stopPropagation(); cityToggle(undefined, locBtn); });
  clockBtn.addEventListener('click', function(e){ if(!isMobile()) return; e.stopPropagation(); cityToggle(undefined, clockBtn); });
  $('#wxCityBtn').addEventListener('click', function(e){ e.stopPropagation(); cityToggle(true, isMobile() ? clockBtn : locBtn); });
  $$('#cityList button').forEach(function(b){ b.addEventListener('click', function(){ var c = CITIES.filter(function(x){ return x.id === b.getAttribute('data-city'); })[0]; if(c) setCity(c); cityToggle(false); toast(c.name, 'Clock and weather now follow '+c.name+'.'); }); });
  document.addEventListener('click', function(e){ if(!cityMenu.hidden && !e.target.closest('#cityMenu')) cityToggle(false); });

  /* calendar: click the menubar date on desktop for a plain month view */
  var calPop = $('#calPop');
  function closePops(keep){
    if(keep !== 'city' && !cityMenu.hidden){ cityMenu.hidden = true; locBtn.classList.remove('on'); clockBtn.classList.remove('on'); }
    if(keep !== 'cal' && !calPop.hidden){ calPop.hidden = true; clockBtn.classList.remove('on'); }
    if(keep !== 'wx' && !wxPop.hidden){ wxPop.hidden = true; wxEl.classList.remove('on'); }
    var pwm = $('#pwMenu'); if(keep !== 'pw' && pwm && !pwm.hidden){ pwm.hidden = true; }
    var tgm = $('#tgMenu'); if(keep !== 'menu' && tgm && !tgm.hidden){ tgm.hidden = true; $('#mbLogo').classList.remove('on'); }
  }
  function calParts(){
    try {
      var g = {}; new Intl.DateTimeFormat('en-US', { timeZone:CITY.tz, year:'numeric', month:'numeric', day:'numeric' }).formatToParts(new Date()).forEach(function(x){ g[x.type] = x.value; });
      return { y:+g.year, m:+g.month, d:+g.day };
    } catch(e){ var n = new Date(); return { y:n.getFullYear(), m:n.getMonth()+1, d:n.getDate() }; }
  }
  function calBuild(){
    var c = calParts(), first = new Date(Date.UTC(c.y, c.m-1, 1)).getUTCDay(), days = new Date(Date.UTC(c.y, c.m, 0)).getUTCDate();
    $('#calMon').textContent = new Date(Date.UTC(c.y, c.m-1, 1)).toLocaleString('en-US', { timeZone:'UTC', month:'long', year:'numeric' });
    $('#calCity').textContent = CITY.short;
    var h = ['S','M','T','W','T','F','S'].map(function(d){ return '<i>'+d+'</i>'; }).join('');
    for(var i = 0; i < first; i++) h += '<span class="blank">0</span>';
    for(var d = 1; d <= days; d++){
      var wd = (first + d - 1) % 7, cls = d === c.d ? 'now' : (wd === 0 || wd === 6 ? 'we' : '');
      h += '<span class="'+cls+'">'+d+'</span>';
    }
    $('#calGrid').innerHTML = h;
  }
  function calToggle(force){
    var show = typeof force === 'boolean' ? force : calPop.hidden;
    calPop.hidden = !show; clockBtn.classList.toggle('on', show);
    if(show){
      closePops('cal'); calBuild();
      var r = clockBtn.getBoundingClientRect(), rr = root.getBoundingClientRect(), mw = calPop.offsetWidth;
      calPop.style.left = Math.max(8, Math.min(rr.width - mw - 8, r.left - rr.left + r.width/2 - mw/2))+'px';
      calPop.style.right = 'auto';
    }
  }
  clockBtn.addEventListener('click', function(e){ if(isMobile()) return; e.stopPropagation(); calToggle(); });
  document.addEventListener('click', function(e){ if(!calPop.hidden && !e.target.closest('#calPop') && !e.target.closest('#mbClock')) calToggle(false); });

/* tigOS core app.js, part 05: home screen. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------------- home screen ---------------- */
  var P = TIG.person;
  $('#home').innerHTML =
    '<div class="hi">'+(A.headshot ? '<img src="'+A.headshot+'" alt="">' : '')+'<i></i>'+esc(P.title)+' at '+esc(P.company)+' · '+esc(P.location)+'</div>'+
    '<h1>Hi, I\u2019m Chase.<br>I make marketing <em>clear.</em></h1>'+
    '<p class="lead">'+esc(P.tagline)+'. '+esc(P.summary)+'</p>'+
    '<div class="hint"><span class="arrow"><svg viewBox="0 0 24 24"><path d="M12 5v14M6 13l6 6 6-6"/></svg></span>'+(isMobile() ? 'Tap an app in the dock to start.' : 'Pick an app from the dock, or press <kbd>\u2318</kbd><kbd>K</kbd> to search.')+'</div>';

/* tigOS core app.js, part 06: desktop icons dock. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------------- desktop icons + dock ---------------- */
  function tileHTML(id){ var a = APPS[id]; return '<span class="tile '+a.tile+'">'+ic(a.icon)+'</span>'; }
  $('#dock').innerHTML = DOCK_ORDER.map(function(id, i){
    return (i === DOCK_ORDER.length-1 ? '<span class="sep"></span>' : '') +
      '<button class="dk" type="button" data-open="'+id+'" data-dock="'+id+'" aria-label="'+esc(APPS[id].title)+'">'+tileHTML(id)+'<span class="dot"></span><span class="tip">'+esc(APPS[id].title)+'</span></button>';
  }).join('') + '<a class="dk" href="'+TIG.contact.linkedin+'" target="_blank" rel="noopener" aria-label="LinkedIn"><span class="tile linkedin">'+ic('linkedin')+'</span><span class="tip">LinkedIn \u2197</span></a>';

/* tigOS core app.js, part 07: window manager. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------------- window manager ---------------- */
  var WM = { z:20, wins:{}, cascade:0 };
  var winsEl = $('#windows'), desk = $('#desktop');
  function updateChrome(){
    var open = Object.keys(WM.wins), shown = open.filter(function(k){ return !WM.wins[k].min; });
    root.classList.toggle('has-windows', shown.length > 0);   /* all minimized = the hero comes back, so an empty desktop never looks broken */
    dockTemp(open);
    $$('.dk').forEach(function(d){ d.classList.toggle('open', open.indexOf(d.getAttribute('data-dock')) > -1); });
    var top = topWin(true);
    $('#mbApp').textContent = top ? APPS[top.id].title : P.name;
  }
  /* hidden apps (Arcade, Pets) get a dock icon only while they are open, like a running app that is not pinned */
  function dockTemp(open){
    var dock = $('#dock'); if(!dock) return;
    var want = open.filter(function(k){ return APPS[k] && APPS[k].hidden; }), have = $$('.dk.tmp', dock), sep = $('.sep.tmpsep', dock), anchor = $('a.dk', dock);
    have.forEach(function(d){ if(want.indexOf(d.getAttribute('data-dock')) < 0){ d.classList.add('gone'); setTimeout(function(){ d.remove(); var s2 = $('.sep.tmpsep', dock); if(s2 && !$('.dk.tmp:not(.gone)', dock)) s2.remove(); }, 260); } });
    want.forEach(function(id){ if($('.dk.tmp[data-dock="'+id+'"]', dock)) return;
      if(!$('.sep.tmpsep', dock)){ sep = document.createElement('span'); sep.className = 'sep tmpsep'; dock.insertBefore(sep, anchor); }
      var b = document.createElement('button'); b.className = 'dk tmp'; b.type = 'button'; b.setAttribute('data-open', id); b.setAttribute('data-dock', id); b.setAttribute('aria-label', APPS[id].title);
      b.innerHTML = tileHTML(id)+'<span class="dot"></span><span class="tip">'+esc(APPS[id].title)+'</span>'; dock.insertBefore(b, anchor); });
  }
  function dockTop(){ var d = $('#dock'); if(!d) return desk.clientHeight - 84; return Math.round(d.getBoundingClientRect().top - desk.getBoundingClientRect().top); }
  /* the area windows may occupy. A bottom dock reserves its strip; a side dock reserves its column instead; an auto-hidden dock reserves nothing (it slides over the windows, like macOS) */
  function area(){
    var W = desk.clientWidth, H = desk.clientHeight, hide = root.classList.contains('dock-hide'), left = root.classList.contains('dock-left'), right = root.classList.contains('dock-right'), d = $('#dock');
    var a = { x0:(root.classList.contains('u-greggyd') && !isMobile()) ? 72 : 0, x1:W, y1:H - 10 };
    if(d && !hide && !isMobile()){ var r = d.getBoundingClientRect(), dr = desk.getBoundingClientRect(); if(left) a.x0 = Math.max(a.x0, Math.round(r.right - dr.left) + 8); else if(right) a.x1 = Math.round(r.left - dr.left) - 8; else a.y1 = dockTop() - 10; }
    return a;
  }
  function topWin(shownOnly){ var best=null; Object.keys(WM.wins).forEach(function(k){ var w=WM.wins[k]; if(shownOnly && w.min) return; if(!best || +w.el.style.zIndex > +best.el.style.zIndex) best=w; }); return best; }
  function focus(w){ if(!w) return; WM.z++; w.el.style.zIndex = WM.z; $$('.win').forEach(function(e){ e.classList.remove('focus'); }); w.el.classList.add('focus'); updateChrome(); }

  function open(id, opts){
    opts = opts || {};
    var a = APPS[id]; if(!a) return;
    if(WM.wins[id]){ var ex = WM.wins[id]; if(ex.min){ restore(ex); } focus(ex); if(opts.route && ex.route) ex.route(opts.route); return ex; }
    if(isMobile()){ Object.keys(WM.wins).forEach(function(k){ var o = WM.wins[k]; o.el.remove(); delete WM.wins[k]; }); }   // phones: one app at a time
    var el = document.createElement('section'); el.className = 'win'; el.setAttribute('role','dialog'); el.setAttribute('aria-label', a.title); el.dataset.app = id;
    var ar = area(), lx = ar.x0;   // linux skin or a left dock: launcher column on the left
    var dw = ar.x1 - lx, dh = desk.clientHeight, limit = ar.y1;   // never sit under the dock
    var W = Math.min(a.w, dw - 28), H = Math.min(a.h, limit - 20);
    var x = lx + Math.round((dw - W)/2), y = Math.max(10, Math.round((limit - H)/2));
    var tw = topWin();
    if(tw && !tw.max){ x = tw.el.offsetLeft + 36; y = tw.el.offsetTop + 32; if(x + W > lx + dw - 8 || y + H > limit){ x = lx + 24 + (WM.cascade%4)*30; y = 12 + (WM.cascade%4)*22; if(y + H > limit) y = Math.max(10, limit - H); } }
    WM.cascade++;
    el.style.cssText = 'left:'+x+'px;top:'+y+'px;width:'+W+'px;height:'+H+'px;z-index:'+(++WM.z);
    if(opts.from){ var r = opts.from.getBoundingClientRect(), dr = desk.getBoundingClientRect(); el.style.setProperty('--ox', (r.left - dr.left + r.width/2 - x)+'px'); el.style.setProperty('--oy', (r.top - dr.top + r.height/2 - y)+'px'); }
    el.innerHTML = '<div class="win-bar"><div class="lights"><button class="c" type="button" aria-label="Close"></button><button class="m" type="button" aria-label="Minimize"></button><button class="z" type="button" aria-label="Zoom"></button></div><div class="win-title">'+ic(a.icon)+esc(a.title)+'</div><div class="win-tools"></div><button class="win-close-m" type="button" aria-label="Close">Done</button></div><div class="win-body"></div><div class="rz resizer se" aria-hidden="true"></div><div class="rz sw" aria-hidden="true"></div><div class="rz ne" aria-hidden="true"></div><div class="rz nw" aria-hidden="true"></div>';
    winsEl.appendChild(el);
    var w = { id:id, el:el, body:$('.win-body', el), tools:$('.win-tools', el), min:false, max:false, prev:null };
    WM.wins[id] = w;
    $('.c', el).addEventListener('click', function(e){ e.stopPropagation(); close(w); });
    $('.win-close-m', el).addEventListener('click', function(e){ e.stopPropagation(); close(w); });
    $('.m', el).addEventListener('click', function(e){ e.stopPropagation(); minimize(w); });
    $('.z', el).addEventListener('click', function(e){ e.stopPropagation(); zoom(w); });
    $('.win-bar', el).addEventListener('dblclick', function(e){ if(!e.target.closest('.lights')) zoom(w); });
    el.addEventListener('pointerdown', function(){ focus(w); });
    makeDraggable(w); makeResizable(w);
    RENDER[id](w);
    if(opts.route && w.route) w.route(opts.route);
    focus(w);
    var dk = $('[data-dock="'+id+'"]'); if(dk){ dk.classList.remove('bounce'); void dk.offsetWidth; dk.classList.add('bounce'); }
    return w;
  }
  function close(w){ if(!w || w.closingNow) return; w.closingNow = true; if(w.destroy) try { w.destroy(); } catch(e){} w.el.style.animation = ''; w.el.classList.add('closing'); setTimeout(function(){ w.el.remove(); delete WM.wins[w.id]; updateChrome(); var t = topWin(); if(t) focus(t); }, 260); }
  /* genie: the window folds toward its own dock icon (--dx/--dy = icon centre minus window centre) and back out again */
  function aimAtDock(w){
    var dk = $('[data-dock="'+w.id+'"]'), r = w.el.getBoundingClientRect(); if(!dk) return;
    var d = dk.getBoundingClientRect(); w.el.style.setProperty('--dx', Math.round(d.left + d.width/2 - (r.left + r.width/2))+'px'); w.el.style.setProperty('--dy', Math.round(d.top + d.height/2 - (r.top + r.height/2))+'px');
  }
  function minimize(w){
    if(w.min || w.el.classList.contains('minimizing')) return;
    if(w.el.classList.contains('fs')) gameFs(w, false);
    w.min = true; aimAtDock(w); w.el.classList.remove('restoring'); w.el.style.animation = ''; w.el.classList.add('minimizing');
    var dk = $('[data-dock="'+w.id+'"]'); if(dk) setTimeout(function(){ dk.classList.remove('bounce'); void dk.offsetWidth; dk.classList.add('bounce'); }, 420);
    var done = false, finish = function(){ if(done) return; done = true; w.el.style.display = 'none'; w.el.classList.remove('minimizing'); var t = topWin(true); if(t) focus(t); updateChrome(); };
    w.el.addEventListener('animationend', function h(e){ if(e.target !== w.el) return; w.el.removeEventListener('animationend', h); finish(); });
    setTimeout(finish, (parseFloat(getComputedStyle(w.el).animationDuration) || .6) * 1000 + 400);   /* safety net if animationend never fires */
    toast(APPS[w.id].title+' minimized', 'Click its dock icon to bring it back.');
  }
  function restore(w){
    w.min = false; w.el.style.display = ''; w.el.style.animation = ''; aimAtDock(w); w.el.classList.add('restoring');
    var settle = function(){ w.el.style.animation = 'none'; w.el.classList.remove('restoring'); };   /* pin the final frame BEFORE dropping the class, or the intro (winIn) replays and blinks */
    var doneR = false, fin = function(){ if(doneR) return; doneR = true; settle(); };
    w.el.addEventListener('animationend', function h(e){ if(e.target !== w.el) return; w.el.removeEventListener('animationend', h); fin(); });
    setTimeout(fin, (parseFloat(getComputedStyle(w.el).animationDuration) || .55) * 1000 + 300);
    updateChrome();
  }
  function zoom(w){
    if(w.id === 'games'){ gameFs(w); return; }   /* the green light on a game means full screen, not just big */
    if(isMobile()) return;
    clearTimeout(w.zoomT); w.el.classList.add('zooming');   /* geometry is inline, so a transition on left/top/width/height glides it there */
    if(!w.max){ w.prev = w.el.style.cssText; w.max = true; w.el.classList.add('max'); var az = area(); w.el.style.left = az.x0+'px'; w.el.style.top = '0px'; w.el.style.width = (az.x1 - az.x0)+'px'; w.el.style.height = az.y1+'px'; }
    else { w.max = false; w.el.classList.remove('max'); var z = w.el.style.zIndex; w.el.style.cssText = w.prev; w.el.style.zIndex = z; }
    w.zoomT = setTimeout(function(){ w.el.classList.remove('zooming'); }, 500);
  }
  function makeDraggable(w){
    var bar = $('.win-bar', w.el), sx, sy, ox, oy, moving = false;
    bar.addEventListener('pointerdown', function(e){
      if(e.target.closest('.lights, .win-tools') || isMobile() || w.max || w.el.classList.contains('fs')) return;
      moving = true; sx = e.clientX; sy = e.clientY; ox = w.el.offsetLeft; oy = w.el.offsetTop; w.el.classList.add('dragging'); bar.setPointerCapture(e.pointerId);
    });
    bar.addEventListener('pointermove', function(e){
      if(!moving) return;
      var nx = ox + (e.clientX - sx), ny = oy + (e.clientY - sy);
      nx = Math.max(-w.el.offsetWidth + 120, Math.min(desk.clientWidth - 120, nx)); ny = Math.max(0, Math.min(desk.clientHeight - 60, ny));
      w.el.style.left = nx+'px'; w.el.style.top = ny+'px';
    });
    var end = function(){ if(moving){ moving = false; w.el.classList.remove('dragging'); } };
    bar.addEventListener('pointerup', end); bar.addEventListener('pointercancel', end);
  }
  function makeResizable(w){
    var MINW = 360, MINH = 240;
    $$('.rz', w.el).forEach(function(rz){
      var dir = rz.classList.contains('sw') ? 'sw' : rz.classList.contains('ne') ? 'ne' : rz.classList.contains('nw') ? 'nw' : 'se';
      var west = dir === 'sw' || dir === 'nw', north = dir === 'ne' || dir === 'nw';
      var sx, sy, sw, sh, sl, st, on = false;
      rz.addEventListener('pointerdown', function(e){
        if(isMobile() || w.max) return;
        on = true; sx = e.clientX; sy = e.clientY; sw = w.el.offsetWidth; sh = w.el.offsetHeight; sl = w.el.offsetLeft; st = w.el.offsetTop;
        rz.setPointerCapture(e.pointerId); w.el.classList.add('dragging'); focus(w); e.stopPropagation(); e.preventDefault();
      });
      rz.addEventListener('pointermove', function(e){
        if(!on) return;
        var dx = e.clientX - sx, dy = e.clientY - sy, ar = area(), lim = ar.y1, maxW = ar.x1;
        if(west){ var nw2 = Math.max(MINW, Math.min(sl + sw - ar.x0, sw - dx)); w.el.style.left = (sl + sw - nw2)+'px'; w.el.style.width = nw2+'px'; }
        else { w.el.style.width = Math.max(MINW, Math.min(maxW - sl, sw + dx))+'px'; }
        if(north){ var nh = Math.max(MINH, Math.min(st + sh, sh - dy)); w.el.style.top = Math.max(0, st + sh - nh)+'px'; w.el.style.height = nh+'px'; }
        else { w.el.style.height = Math.max(MINH, Math.min(lim - st, sh + dy))+'px'; }
      });
      var end = function(){ on = false; w.el.classList.remove('dragging'); };
      rz.addEventListener('pointerup', end); rz.addEventListener('pointercancel', end);
    });
  }

/* tigOS core app.js, part 08: renderers. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------------- renderers ---------------- */
  var RENDER = {};

  RENDER.about = function(w){
    var edu = TIG.education;
    w.body.innerHTML = '<div class="pad">'+
      '<div class="about-hero">'+(A.headshot ? '<img class="avatar" src="'+A.headshot+'" alt="Chase Johnston">' : '')+
        '<div><div class="eyebrow">About</div><div class="h2">'+esc(P.name)+'</div><div class="role"><b>'+esc(P.title)+'</b> · '+esc(P.company)+' · '+esc(P.org)+'</div></div></div>'+
      '<div class="divider"></div>'+
      '<p class="sub" style="max-width:none">'+esc(P.bio)+'</p>'+
      '<div class="sec grid3">'+TIG.stats.slice(0,3).map(function(s,i){ return '<div class="card stat '+['acc-orange','acc-teal','acc-pink'][i]+'"><b>'+esc(s.big)+'</b><span>'+esc(s.label)+'</span><small>'+esc(s.sub)+'</small></div>'; }).join('')+'</div>'+
      '<div class="sec grid2">'+
        '<div class="card"><div class="eyebrow">At a glance</div><dl class="kv"><dt>Role</dt><dd>'+esc(P.title)+'</dd><dt>Company</dt><dd>'+esc(P.company)+'</dd><dt>Focus</dt><dd>'+esc(P.tagline)+'</dd><dt>Location</dt><dd>'+esc(P.location)+'</dd><dt>Education</dt><dd>'+esc(edu.school)+'</dd></dl></div>'+
        '<div class="card"><div class="eyebrow">Experience with</div><div class="logos">'+
          [['Amazon','acc-orange'],['Apple','acc-pink'],['Johnny Mo\u2019s','acc-red'],['Tig Media','acc-teal']].concat(TIG.alsoWorkedWith.map(function(n){ return [n,'acc-violet']; })).map(function(x){ return '<span class="logo-pill '+x[1]+'"><i></i>'+esc(x[0])+'</span>'; }).join('')+
        '</div></div>'+
      '</div>'+
      '<div class="sec" style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn primary" data-open="projects">'+ic('projects')+'See the work</button><button class="btn" data-open="experience">'+ic('exp')+'Career timeline</button><button class="btn" data-open="contact">'+ic('contact')+'Get in touch</button></div>'+
    '</div>';
  };

  RENDER.projects = function(w){
    var list = function(){
      w.tools.innerHTML = '';
      w.body.innerHTML = '<div class="pad"><div class="eyebrow">Selected work · '+TIG.projects.length+' projects</div><div class="h2">Work that shipped.</div><p class="sub">Case studies from Amazon, Apple, and two businesses I helped build. Each one covers the overview, the execution, and the results.</p>'+
        '<div class="proj-list sec">'+TIG.projects.map(function(p){
          return '<button class="card hover pcard acc-'+p.accent+'" type="button" data-proj="'+p.id+'"><span class="thumb">'+img(p.images[0][0], p.images[0][1])+'</span><span><span class="num">Project '+p.n+' · '+esc(p.company)+'</span><div class="h3">'+esc(p.name)+'</div><span class="tag">'+esc(p.tag)+'</span></span><span class="arrow">\u203A</span></button>';
        }).join('')+'</div></div>';
      $$('[data-proj]', w.body).forEach(function(b){ b.addEventListener('click', function(){ detail(b.getAttribute('data-proj')); }); });
    };
    var detail = function(id){
      var i = TIG.projects.findIndex(function(p){ return p.id === id; }); if(i < 0) return list();
      var p = TIG.projects[i], prev = TIG.projects[(i+TIG.projects.length-1)%TIG.projects.length], next = TIG.projects[(i+1)%TIG.projects.length];
      w.tools.innerHTML = '<button type="button" class="js-back">'+ic('back')+'All projects</button>';
      w.body.innerHTML = '<div class="pad pdetail acc-'+p.accent+'"><button class="back js-back" type="button">'+ic('back')+'All projects</button>'+
        '<div class="eyebrow acc-txt">Project '+p.n+' · '+esc(p.company)+'</div><div class="h2">'+esc(p.name)+'</div><p class="sub">'+esc(p.tag)+'</p>'+
        '<div class="gallery">'+p.images.map(function(im){ return A[im[0]] ? '<figure data-lb="'+im[0]+'" data-cap="'+esc(im[1])+'">'+img(im[0], im[1])+'<figcaption>'+esc(im[1])+'</figcaption></figure>' : ''; }).join('')+'</div>'+
        '<div class="grid3 sec">'+p.metrics.map(function(m){ return '<div class="card stat"><b>'+esc(m[0])+'</b><span>'+esc(m[1])+'</span></div>'; }).join('')+'</div>'+
        '<div class="oer"><div class="card"><b>Overview</b><p>'+esc(p.overview)+'</p></div><div class="card"><b>Execution</b><p>'+esc(p.execution)+'</p></div><div class="card"><b>Results</b><p>'+esc(p.results)+'</p></div></div>'+
        '<div class="pnav"><button class="card hover" type="button" data-proj="'+prev.id+'"><small>\u2039 Previous</small>'+esc(prev.name)+'</button><button class="card hover" type="button" data-proj="'+next.id+'"><small>Next \u203A</small>'+esc(next.name)+'</button></div>'+
      '</div>';
      w.body.scrollTop = 0;
      $$('.js-back', w.el).forEach(function(b){ b.addEventListener('click', list); });
      $$('[data-proj]', w.body).forEach(function(b){ b.addEventListener('click', function(){ detail(b.getAttribute('data-proj')); }); });
      $$('[data-lb]', w.body).forEach(function(f){ f.addEventListener('click', function(){ lightbox(f.getAttribute('data-lb'), f.getAttribute('data-cap')); }); });
    };
    w.route = function(r){ r ? detail(r) : list(); };
    list();
  };

  RENDER.experience = function(w){
    var edu = TIG.education;
    w.body.innerHTML = '<div class="pad"><div class="eyebrow">Experience</div><div class="h2">Five roles, one through-line.</div><p class="sub">Take complicated goals, organize the story, and ship something that makes sense to the customer.</p>'+
      '<div class="tl sec">'+TIG.experience.map(function(j, i){
        return '<div class="job card acc-'+j.accent+(i>1?' collapsed':'')+'"><div class="row"><div class="co">'+esc(j.company)+(j.current?' <span class="now"><i></i>Current</span>':'')+'</div><div class="when">'+esc(j.dates)+' · '+esc(j.where)+'</div></div><div class="role">'+esc(j.role)+'</div><ul>'+j.bullets.map(function(b){ return '<li>'+esc(b)+'</li>'; }).join('')+'</ul>'+(i>1?'<button class="more" type="button">Show details \u2193</button>':'')+'</div>';
      }).join('')+'</div>'+
      '<div class="sec card acc-violet"><div class="eyebrow">Education</div><div class="row" style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px"><div><div class="h3">'+esc(edu.school)+'</div><div style="color:var(--muted)">'+esc(edu.degree)+' · '+esc(edu.year)+'</div></div><div class="when" style="color:var(--muted);font-size:13px">'+esc(edu.where)+'</div></div></div>'+
      '<div class="sec" style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn primary" data-open="resume">'+ic('download')+'Download the one-page resume</button><button class="btn" data-open="projects">'+ic('projects')+'See the projects</button></div>'+
    '</div>';
    $$('.more', w.body).forEach(function(b){ b.addEventListener('click', function(){ var j = b.closest('.job'); j.classList.toggle('collapsed'); b.textContent = j.classList.contains('collapsed') ? 'Show details \u2193' : 'Hide details \u2191'; }); });
  };

  RENDER.resume = function(w){
    var pdf = A.resume_pdf || '#';
    w.tools.innerHTML = '<a href="'+pdf+'" download="Chase-Johnston-Resume.pdf">'+ic('download')+'Download</a>';
    w.body.innerHTML = '<div class="pad"><div class="res-wrap">'+
      '<div class="res-paper" data-lb="resume_preview" data-cap="Chase Johnston, resume (August 2026)">'+(A.resume_preview ? '<img src="'+A.resume_preview+'" alt="Chase Johnston resume preview" decoding="async">' : '<div class="pad">Preview unavailable</div>')+'<span class="zoom-hint">Click to enlarge</span></div>'+
      '<div class="res-side">'+
        '<a class="btn primary" href="'+pdf+'" download="Chase-Johnston-Resume.pdf">'+ic('download')+'Download PDF</a>'+
        '<a class="btn" href="'+pdf+'" target="_blank" rel="noopener">'+ic('link')+'Open in new tab</a>'+
        '<div class="card"><div class="res-fact"><span>Format</span><b>One page · PDF</b></div><div class="res-fact"><span>Updated</span><b>August 2026</b></div><div class="res-fact"><span>Role</span><b>'+esc(P.title)+'</b></div><div class="res-fact"><span>Based in</span><b>'+esc(P.location)+'</b></div></div>'+
        '<div class="card"><p>Prefer the interactive version? Every role on this page is also in the <b>Experience</b> app, and every project has a full case study in <b>Projects</b>.</p></div>'+
        '<button class="btn" data-open="experience">'+ic('exp')+'Open Experience</button>'+
      '</div></div></div>';
    var paper = $('.res-paper', w.body); if(paper) paper.addEventListener('click', function(){ lightbox('resume_preview', paper.getAttribute('data-cap')); });
  };

  RENDER.skills = function(w){
    w.body.innerHTML = '<div class="pad"><div class="eyebrow">Skills</div><div class="h2">The toolkit.</div><p class="sub">Marketing strategy, creative judgment, and the tools I use to ship. Every item here is backed by a role or project on this site.</p>'+
      TIG.skills.groups.map(function(g){ return '<div class="skill-group acc-'+g.accent+'"><div class="h3"><i></i>'+esc(g.name)+'</div><div class="skills-grid">'+g.items.map(function(s){ return '<span class="skill">'+esc(s)+'</span>'; }).join('')+'</div></div>'; }).join('')+
      '<div class="proof"><div class="eyebrow">Proof points</div><div style="display:grid;gap:10px">'+
        [['acc-orange','10x','Grew the Emerging Brands program from 35 campaigns in 2025 to 350+ in 2026.'],['acc-teal','300+','Campaigns tracked in a performance dashboard I designed and built with AI tools, used weekly by the team and three agencies.'],['acc-blue','42%','Average open rate on the 4-week Hub partner email series, 12% above baseline.'],['acc-pink','$11.9M','B2B revenue across the SMB portfolio I managed at Apple.']].map(function(x){ return '<div class="card '+x[0]+'"><div class="k">'+x[1]+'</div><p>'+esc(x[2])+'</p></div>'; }).join('')+
      '</div></div></div>';
  };

/* tigOS core app.js, part 09: journey. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------------- Journey: a dotted world, five cities, seven stops, one little plane ---------------- */
  RENDER.journey = function(w){
    var S = TIG.journey, CT = TIG.cities, M = TIG.map, ACC = { orange:'#ff8a00', amber:'#ffd166', teal:'#63e6be', pink:'#ff7ab6', blue:'#8cc7ff', violet:'#a78bfa', red:'#ff6b6b' };
    var CIDS = []; S.forEach(function(s){ if(CIDS.indexOf(s.city) < 0) CIDS.push(s.city); });   /* cities in order of first visit */
    var visits = {}; S.forEach(function(s){ visits[s.city] = (visits[s.city] || 0) + 1; });
    var cityOf = function(s){ return CT[s.city]; }, where = function(s){ var c = cityOf(s); return c.city+', '+c.state; };
    w.body.innerHTML = '<div class="jr">'+
      '<div class="jr-map"><canvas class="jr-cv" aria-label="Map of the places Chase has lived and worked"></canvas>'+
        '<div class="jr-pins">'+CIDS.map(function(id){ var c = CT[id]; return '<button type="button" class="jr-pin acc-'+c.accent+(c.side === 'left' ? ' l' : '')+'" data-city="'+id+'" aria-label="'+esc(c.city)+', '+esc(c.state)+'"><i></i><b></b><span>'+esc(c.city)+(visits[id] > 1 ? ' <em>\u00d7'+visits[id]+'</em>' : '')+'</span></button>'; }).join('')+'</div>'+
        '<div class="jr-top"><div class="eyebrow">Journey</div><div class="jr-h">Seven stops, five cities, one through-line.</div></div>'+
        '<button type="button" class="jr-replay" aria-label="Replay the flight"><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4.5h4.5"/></svg><span>Replay</span></button>'+
      '</div>'+
      '<div class="jr-side">'+
        '<div class="jr-stops">'+S.map(function(s, i){ return '<button type="button" class="jr-stop acc-'+s.accent+'" data-stop="'+i+'"><i>'+(i+1)+'</i><span><b>'+esc(s.company)+'</b><small>'+esc(where(s))+' \u00b7 '+esc(s.years)+'</small></span></button>'; }).join('')+'</div>'+
        '<div class="jr-card card" aria-live="polite"></div>'+
      '</div>'+
    '</div>';
    var cv = $('.jr-cv', w.body), cx = cv.getContext('2d'), mapEl = $('.jr-map', w.body), pins = $$('.jr-pin', w.body), stops = $$('.jr-stop', w.body), card = $('.jr-card', w.body);
    var pinOf = {}; pins.forEach(function(p){ pinOf[p.getAttribute('data-city')] = p; });
    var dpr = Math.min(2, window.devicePixelRatio || 1), Wd = 0, Hd = 0;
    var dots = [];   // unpack the land bitmask once
    (function(){ var rows = M.bits; for(var r = 0; r < M.rows; r++){ var bin = atob(rows[r]); for(var c = 0; c < M.cols; c++){ if(bin.charCodeAt(c >> 3) & (128 >> (c & 7))) dots.push(c, r); } } })();
    var merc = function(lat){ return Math.log(Math.tan(Math.PI/4 + lat*Math.PI/360)); }, Y0 = merc(M.lat0), Y1 = merc(M.lat1);
    var geo = function(lon, lat){ return { x:(lon + 180)/360*M.cols, y:(Y0 - merc(lat))/(Y0 - Y1)*M.rows }; };   /* dot-grid units */
    var P = {}; CIDS.forEach(function(id){ P[id] = geo(CT[id].lon, CT[id].lat); });
    var PL = CIDS.map(function(id){ return P[id]; });
    /* camera: centre (grid units) + scale (css px per grid unit); eased from "world" to "north america" */
    var cam = { x:M.cols/2, y:M.rows/2, k:1 }, camTo = null, camFrom = null, camT0 = 0, camDur = 0, started = false;
    var view = function(name){
      var pad = isMobile() ? 1.12 : 1.0;
      if(name === 'world'){ var k = Math.min(Wd/M.cols, Hd/M.rows); return { x:M.cols/2, y:M.rows/2 + (isMobile() ? 4 : 0), k:k }; }
      var minx = Math.min.apply(null, PL.map(function(p){ return p.x; })) - (isMobile() ? 26 : 18), maxx = Math.max.apply(null, PL.map(function(p){ return p.x; })) + (isMobile() ? 22 : 24);   /* room for labels either side */
      var miny = Math.min.apply(null, PL.map(function(p){ return p.y; })) - 7, maxy = Math.max.apply(null, PL.map(function(p){ return p.y; })) + 6;
      var k2 = Math.min(Wd/((maxx - minx)*pad), Hd/((maxy - miny)*pad)); return { x:(minx + maxx)/2, y:(miny + maxy)/2 + (isMobile() ? 1 : 0), k:k2 };
    };
    var flyCam = function(to, ms){ camFrom = { x:cam.x, y:cam.y, k:cam.k }; camTo = to; camT0 = performance.now(); camDur = ms; };
    var toPx = function(p){ return { x:(p.x - cam.x)*cam.k + Wd/2, y:(p.y - cam.y)*cam.k + Hd/2 }; };
    var ease = function(t){ return t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2; };
    /* the flight: quadratic arcs that bow north like a real great-circle route (Seattle to New York goes up over the lakes); pure north-south hops bow out over the Pacific, and a return leg bows the other way so out-and-back pairs draw a loop */
    var legs = [], plane = { on:false, leg:0, t0:0, x:0, y:0, a:0 }, trail = [], done = [], pausedAt = 0, LEG_MS = 1700, PAUSE = 480, cur = -1, motion = function(){ return PREF.motion !== 'off'; };
    var arc = function(a, b, t, flip){ var mx = (a.x + b.x)/2, my = (a.y + b.y)/2, d = Math.hypot(b.x - a.x, b.y - a.y) || 1, lift = Math.min(d*.32, 30), nx = -(b.y - a.y)/d, ny = (b.x - a.x)/d;
      if(Math.abs(ny) < .35 ? nx > 0 : ny > 0){ nx = -nx; ny = -ny; }   /* normal points north (screen up), or west for near-vertical legs */
      if(flip){ nx = -nx; ny = -ny; }
      var cxp = mx + nx*lift, cyp = my + ny*lift, u = 1 - t; return { x:u*u*a.x + 2*u*t*cxp + t*t*b.x, y:u*u*a.y + 2*u*t*cyp + t*t*b.y }; };
    var flipFor = function(i){ for(var j = 0; j < i; j++){ if(S[j].city === S[i+1].city && S[j+1].city === S[i].city) return true; } return false; };   /* a leg that reverses an earlier one */
    var setCard = function(i, silent){
      var s = S[i], c = cityOf(s); cur = i; card.className = 'jr-card card acc-'+s.accent;
      card.innerHTML = '<div class="jr-where"><span class="jr-dot"></span>'+esc(where(s))+' <span class="jr-yrs">'+esc(s.years)+'</span>'+(s.current ? ' <span class="now"><i></i>Now</span>' : '')+'</div>'+
        '<div class="h3">'+esc(s.company)+'</div><div class="jr-org">'+esc(s.role)+'</div>'+
        '<p class="sub">'+esc(s.blurb)+'</p><div class="jr-tags">'+s.tags.map(function(t){ return '<span class="chip">'+esc(t)+'</span>'; }).join('')+'</div>'+
        (i === S.length-1 ? '<button type="button" class="btn jr-more" data-open="experience">'+ic('exp')+'Full experience</button>' : '');
      pins.forEach(function(p){ p.classList.toggle('on', p.getAttribute('data-city') === s.city); }); stops.forEach(function(p, j){ p.classList.toggle('on', j === i); });
      var on = $('.jr-stop.on', w.body); if(on && !isMobile()) on.scrollIntoView({ block:'nearest' });
      if(!silent && isMobile()) card.scrollIntoView({ behavior:'smooth', block:'nearest' });
    };
    var reveal = function(cityId, pop){ var p = pinOf[cityId]; if(!p) return; p.classList.remove('hid'); if(pop){ p.classList.remove('drop'); void p.offsetWidth; p.classList.add('drop'); } };
    var startFlight = function(){
      legs = []; for(var i = 0; i < S.length - 1; i++) legs.push({ a:P[S[i].city], b:P[S[i+1].city], to:i+1, flip:flipFor(i) });
      done = []; trail = []; plane = { on:true, leg:0, t0:performance.now() + PAUSE, x:P[S[0].city].x, y:P[S[0].city].y, a:0 };
      pins.forEach(function(p){ p.classList.add('hid'); p.classList.remove('drop'); }); reveal(S[0].city, true);
      setCard(0, true);
    };
    var flyTo = function(i){   /* user picked a stop: hop straight there */
      if(i === cur && !plane.on){ setCard(i); return; }
      var from = plane.on ? { x:plane.x, y:plane.y } : P[S[cur < 0 ? 0 : cur].city];
      legs = [{ a:from, b:P[S[i].city], to:i, direct:true }]; plane = { on:true, leg:0, t0:performance.now(), x:from.x, y:from.y, a:0 }; trail = [];
      done = []; for(var d = 0; d < S.length - 1; d++) done.push(d);   /* every route is known once the visitor takes over */
      pins.forEach(function(p){ p.classList.remove('hid', 'drop'); }); setCard(i);
    };
    var resize = function(){
      var wd = mapEl.clientWidth, hd = mapEl.clientHeight;   /* layout size: unaffected by the genie transform, 0 while display:none */
      if(!wd || !hd) return;
      if(wd === Wd && hd === Hd) return;
      Wd = wd; Hd = hd; cv.width = Wd*dpr; cv.height = Hd*dpr; cv.style.width = Wd+'px'; cv.style.height = Hd+'px'; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var v = view(started ? 'na' : 'world'); if(camTo) camTo = v; else cam = v;   /* keep the framing when the window is resized or restored */
    };
    var placePins = function(){ CIDS.forEach(function(id){ var q = toPx(P[id]), p = pinOf[id]; p.style.left = q.x+'px'; p.style.top = q.y+'px'; }); };
    var raf = 0, alive = true;
    var frame = function(now){
      if(!alive) return; raf = requestAnimationFrame(frame);
      if(w.min || document.hidden || !mapEl.clientWidth){ if(!pausedAt) pausedAt = now; return; }
      if(pausedAt){ var gap = now - pausedAt; pausedAt = 0; plane.t0 += gap; camT0 += gap; trail.forEach(function(q){ q.t += gap; }); }   /* resume exactly where we left off */
      resize();
      if(camTo){ var ct = Math.min(1, (now - camT0)/camDur), e = ease(ct); cam = { x:camFrom.x + (camTo.x - camFrom.x)*e, y:camFrom.y + (camTo.y - camFrom.y)*e, k:camFrom.k + (camTo.k - camFrom.k)*e }; if(ct >= 1){ cam = { x:camTo.x, y:camTo.y, k:camTo.k }; camTo = null; } }
      /* plane */
      var L = legs[plane.leg];
      if(plane.on && L && now >= plane.t0){   /* wall-clock flight: frame rate never changes how long a leg takes */
        var t = motion() ? Math.min(1, (now - plane.t0)/LEG_MS) : 1, p = arc(L.a, L.b, t, L.flip), p2 = arc(L.a, L.b, Math.min(1, t + .02), L.flip);
        plane.x = p.x; plane.y = p.y; plane.a = Math.atan2(p2.y - p.y, p2.x - p.x);
        trail.push({ x:p.x, y:p.y, t:now }); if(trail.length > 140) trail.shift();
        if(t >= 1){
          reveal(S[L.to].city, true); if(!L.direct){ done.push(plane.leg); setCard(L.to, true); }
          plane.leg++; plane.t0 = now + PAUSE;
          if(plane.leg >= legs.length){ plane.on = false; pins.forEach(function(p){ p.classList.remove('hid'); }); }
        }
      }
      /* draw */
      cx.clearRect(0, 0, Wd, Hd);
      var light = root.classList.contains('light'), k = cam.k, rad = Math.max(.7, Math.min(2.2, k*.36));
      cx.fillStyle = light ? 'rgba(40,40,70,.22)' : 'rgba(140,199,255,.34)';
      var x0 = cam.x - Wd/2/k - 1, x1 = cam.x + Wd/2/k + 1, y0 = cam.y - Hd/2/k - 1, y1 = cam.y + Hd/2/k + 1;
      cx.beginPath();
      for(var i = 0; i < dots.length; i += 2){ var gx = dots[i], gy = dots[i+1]; if(gx < x0 || gx > x1 || gy < y0 || gy > y1) continue; var px = (gx - cam.x)*k + Wd/2, py = (gy - cam.y)*k + Hd/2; cx.moveTo(px + rad, py); cx.arc(px, py, rad, 0, 6.2832); }
      cx.fill();
      /* completed routes: dotted, in the colour of the chapter they led to */
      cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.setLineDash([2.5, 5.5]); cx.lineWidth = 1.7; cx.globalAlpha = light ? .55 : .7;
      done.forEach(function(li){ var a = P[S[li].city], b = P[S[li+1].city], fl = flipFor(li); cx.strokeStyle = ACC[S[li+1].accent] || '#fff'; cx.beginPath(); for(var s = 0; s <= 28; s++){ var q = toPx(arc(a, b, s/28, fl)); s ? cx.lineTo(q.x, q.y) : cx.moveTo(q.x, q.y); } cx.stroke(); });
      cx.setLineDash([]); cx.globalAlpha = 1;
      /* trail */
      if(trail.length > 1){ var col = ACC[S[L ? L.to : cur < 0 ? 0 : cur].accent] || '#ff8a00'; for(var ti = 1; ti < trail.length; ti++){ var age = (now - trail[ti].t)/900; if(age > 1) continue; var a2 = toPx(trail[ti-1]), b2 = toPx(trail[ti]); cx.beginPath(); cx.moveTo(a2.x, a2.y); cx.lineTo(b2.x, b2.y); cx.strokeStyle = col; cx.globalAlpha = (1 - age)*.9; cx.lineWidth = (1 - age)*3.2 + .4; cx.stroke(); } cx.globalAlpha = 1; }
      /* plane */
      if(plane.on){ var pp = toPx(plane), sz = Math.max(9, Math.min(15, k*3.2)); cx.save(); cx.translate(pp.x, pp.y); cx.rotate(plane.a); cx.shadowColor = 'rgba(0,0,0,.45)'; cx.shadowBlur = 6; cx.shadowOffsetY = 3;
        cx.fillStyle = light ? '#1a1a2e' : '#ffffff'; cx.beginPath(); cx.moveTo(sz, 0); cx.lineTo(-sz*.55, sz*.62); cx.lineTo(-sz*.25, 0); cx.lineTo(-sz*.55, -sz*.62); cx.closePath(); cx.fill(); cx.restore(); }
      placePins();
    };
    resize();
    /* opening: hold on the world, then swoop into the west and start the flight */
    var t0 = setTimeout(function(){ started = true; flyCam(view('na'), motion() ? 1500 : 1); }, motion() ? 650 : 0);
    var t1 = setTimeout(function(){ startFlight(); }, motion() ? 2000 : 30);
    setCard(0, true); pins.forEach(function(p){ p.classList.toggle('hid', p.getAttribute('data-city') !== S[0].city); });
    raf = requestAnimationFrame(frame);
    $('.jr-stops', w.body).addEventListener('click', function(e){ var b = e.target.closest('[data-stop]'); if(b) flyTo(+b.getAttribute('data-stop')); });
    $('.jr-pins', w.body).addEventListener('click', function(e){ var b = e.target.closest('[data-city]'); if(!b) return; var id = b.getAttribute('data-city'), idx = []; S.forEach(function(s, i){ if(s.city === id) idx.push(i); });
      var next = idx.filter(function(i){ return i > cur; })[0]; if(next == null) next = idx[0]; flyTo(next); });   /* a city with several stops cycles through them */
    $('.jr-replay', w.body).addEventListener('click', function(){ started = false; cam = view('world'); started = true; flyCam(view('na'), motion() ? 1300 : 1); pins.forEach(function(p){ p.classList.toggle('hid', p.getAttribute('data-city') !== S[0].city); }); plane.on = false; setTimeout(startFlight, motion() ? 1200 : 0); });
    w.route = function(r){ var q = String(r).toLowerCase(), i = S.findIndex(function(s){ return s.id === q || s.city === q || CT[s.city].city.toLowerCase() === q || s.company.toLowerCase().indexOf(q) === 0; }); if(i > -1) flyTo(i); };
    w.destroy = function(){ alive = false; cancelAnimationFrame(raf); clearTimeout(t0); clearTimeout(t1); };
  };

  RENDER.contact = function(w){
    var C = TIG.contact;
    w.body.innerHTML = '<div class="pad"><div class="eyebrow">Contact</div><div class="h2">Let\u2019s talk.</div><p class="sub">Open to conversations about product marketing, GTM, and growth roles. Email is fastest.</p>'+
      '<div class="contact-grid">'+
        '<button class="card hover crow acc-orange" type="button" data-copy="'+esc(C.email)+'" data-href="mailto:'+esc(C.email)+'"><span class="ico">'+ic('contact')+'</span><span><b>Email</b><span>'+esc(C.email)+'</span></span><small>click to copy</small></button>'+
        '<a class="card hover crow acc-blue" href="'+esc(C.linkedin)+'" target="_blank" rel="noopener"><span class="ico">'+ic('linkedin')+'</span><span><b>LinkedIn</b><span>'+esc(C.linkedinLabel)+'</span></span><small>opens \u2197</small></a>'+
        '<button class="card hover crow acc-teal" type="button" data-copy="'+esc(C.phone)+'" data-href="tel:'+esc(C.phone)+'"><span class="ico">'+ic('phone')+'</span><span><b>Phone</b><span>'+esc(C.phone)+'</span></span><small>click to copy</small></button>'+
        '<button class="card hover crow acc-pink" type="button" data-open="resume"><span class="ico">'+ic('resume')+'</span><span><b>Resume</b><span>One page, PDF</span></span><small>open</small></button>'+
      '</div>'+
      '<div class="sec card"><div class="eyebrow">Based in</div><div class="h3">'+esc(P.location)+'</div><p class="sub">Formerly Seattle.</p></div>'+
    '</div>';
    $$('[data-copy]', w.body).forEach(function(b){ b.addEventListener('click', function(){
      var v = b.getAttribute('data-copy'), href = b.getAttribute('data-href');
      var done = function(ok){ toast(ok ? 'Copied to clipboard' : 'Copy this', v); };
      if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(v).then(function(){ done(true); }, function(){ done(false); }); } else { done(false); }
      if(isMobile() && href){ setTimeout(function(){ window.location.href = href; }, 350); }
    }); });
  };

/* tigOS core app.js, part 10: users easter eggs. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------------- users + easter eggs ---------------- */
  var USER = { name:'chase' };
  var USERS = { chase:{ pw:null, home:'/Users/chase', shell:'%' }, ariel:{ pw:'love', home:'/Users/ariel', shell:'%' }, greggyd:{ pw:'..', home:'/home/greggyd', shell:'$' } };
  var ORIG_TILES = null;
  function heartsOn(){ if(!ORIG_TILES){ ORIG_TILES = $$('.tile use').map(function(u){ return [u, u.getAttribute('href')]; }); } $$('.tile use').forEach(function(u){ u.setAttribute('href', '#i-heart'); }); }
  function heartsOff(){ if(ORIG_TILES){ ORIG_TILES.forEach(function(p){ p[0].setAttribute('href', p[1]); }); } }
  function setUser(name){
    USER.name = name; root.classList.remove('u-ariel', 'u-greggyd'); heartsOff();
    if(name === 'ariel'){ root.classList.add('u-ariel'); heartsOn(); var hs = $('#hearts'); hs.innerHTML = ''; for(var i = 0; i < 26; i++){ var h = document.createElement('i'); h.style.left = (Math.random()*100)+'%'; h.style.animationDuration = (5+Math.random()*6)+'s'; h.style.animationDelay = (-Math.random()*9)+'s'; h.style.width = h.style.height = (14+Math.random()*22)+'px'; h.innerHTML = ic('heart'); hs.appendChild(h); } eggShow('love'); }
    if(name === 'greggyd'){ root.classList.add('u-greggyd'); eggShow('tux'); if(!isMobile()) Object.keys(WM.wins).forEach(function(k){ var w = WM.wins[k]; if(!w.max && w.el.offsetLeft < 80) w.el.style.left = '84px'; }); }
    $$('.term .p').forEach(function(el){ /* leave history as is */ });
  }
/* tigOS core app.js, part 11: login screen. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------------- login screen (Log Out) ---------------- */
  var loginEl = $('#login'), loginPw = $('#loginPw'), loginIn = $('#loginIn'), loginSel = null;
  var USER_META = { chase:{ label:'Chase Johnston', sub:'Admin' }, ariel:{ label:'Ariel', sub:'' }, greggyd:{ label:'greggyd', sub:'' } };
  function loginScreen(){
    Object.keys(WM.wins).forEach(function(k){ close(WM.wins[k]); }); pw.hidden = true; menu.hidden = true; mbLogo.classList.remove('on');
    $('#loginUsers').innerHTML = '<button class="lu" type="button" data-user="chase"><span class="av a-chase">'+(A.headshot ? '<img src="'+A.headshot+'" alt="">' : 'C')+'</span><b>'+esc(USER_META.chase.label)+'<small>'+USER_META.chase.sub+'</small></b></button>';
    loginSel = null; loginPw.hidden = true; loginIn.value = ''; $('#loginHint').textContent = ''; $$('.lu', loginEl).forEach(function(b){ b.classList.remove('dim', 'sel'); });
    loginEl.classList.remove('leaving'); loginEl.hidden = false; tick();
    $$('.lu', loginEl).forEach(function(b){ b.addEventListener('click', function(e){ e.stopPropagation(); var u = b.getAttribute('data-user');
      if(u === 'chase'){ loginGo('chase'); return; }
      loginSel = u; $$('.lu', loginEl).forEach(function(x){ x.classList.toggle('dim', x !== b); x.classList.toggle('sel', x === b); });
      loginPw.hidden = false; loginIn.value = ''; $('#loginHint').textContent = 'Enter password for '+USER_META[u].label; setTimeout(function(){ loginIn.focus(); }, 30);
    }); });
  }
  var loginT;
  function loginGo(u){
    if(loginEl.classList.contains('leaving')) return;
    $('#loginHint').textContent = 'Logging in\u2026';
    loginEl.classList.add('leaving'); root.classList.add('entering');
    clearTimeout(loginT);
    loginT = setTimeout(function(){
      loginEl.hidden = true; loginEl.classList.remove('leaving');
      if(u !== USER.name) setUser(u);
      var g = greeting(); toast(u === 'chase' ? 'Welcome back, Chase' : g.t, 'Logged in as '+u+'@tigos.', g.i);
      setTimeout(function(){ root.classList.remove('entering'); }, 1400);
    }, 550);
  }
  loginPw.addEventListener('submit', function(e){ e.preventDefault(); if(!loginSel) return; if(loginIn.value === USERS[loginSel].pw){ loginGo(loginSel); } else { loginPw.classList.remove('shake'); void loginPw.offsetWidth; loginPw.classList.add('shake'); loginIn.value = ''; $('#loginHint').textContent = 'Wrong password. Try again.'; } });
  loginEl.addEventListener('click', function(e){ if(e.target === loginEl || e.target.classList.contains('login-bg')){ if(loginSel){ loginSel = null; loginPw.hidden = true; $$('.lu', loginEl).forEach(function(x){ x.classList.remove('dim', 'sel'); }); $('#loginHint').textContent = ''; } } });

/* tigOS core app.js, part 12: ladybugs. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------------- ladybugs (Hailey) ---------------- */
  var bugsEl = $('#bugs'), bugsOn = false;
  function bugsRun(){
    if(bugsOn) return; bugsOn = true; bugsEl.innerHTML = '';
    var n = isMobile() ? 7 : 12, H = root.clientHeight;
    for(var i = 0; i < n; i++){
      var b = document.createElement('div'); var rtl = i % 3 === 2; b.className = 'bug'+(rtl ? ' rtl' : '');
      var scale = .7 + Math.random()*.6, dur = 2.2 + Math.random()*1.1, delay = Math.random()*.9;
      b.style.top = (40 + Math.random()*(H - 140))+'px'; b.style.setProperty('--dur', dur+'s'); b.style.animationDelay = delay+'s'; b.style.transform = 'scale('+scale+')';
      b.innerHTML = '<svg viewBox="0 0 64 64"'+(rtl ? ' style="transform:scaleX(-1)"' : '')+'>'+
        '<path class="leg" d="M18 30 L8 24"/><path class="leg b" d="M18 36 L7 38"/><path class="leg" d="M22 42 L14 50"/><path class="leg b" d="M46 30 L56 24"/><path class="leg" d="M46 36 L57 38"/><path class="leg b" d="M42 42 L50 50"/>'+
        '<ellipse cx="32" cy="36" rx="16" ry="14" fill="#e11d48"/><path d="M32 22v28" stroke="#1a1a1a" stroke-width="1.6"/>'+
        '<circle cx="25" cy="32" r="2.6" fill="#1a1a1a"/><circle cx="39" cy="33" r="2.6" fill="#1a1a1a"/><circle cx="28" cy="42" r="2.2" fill="#1a1a1a"/><circle cx="37" cy="42" r="2.2" fill="#1a1a1a"/><circle cx="32" cy="27" r="1.8" fill="#1a1a1a"/>'+
        '<circle cx="32" cy="20" r="6.5" fill="#1a1a1a"/><circle cx="29.5" cy="18.5" r="1.4" fill="#fff"/><circle cx="34.5" cy="18.5" r="1.4" fill="#fff"/><path d="M28 14 L25 9 M36 14 L39 9" stroke="#1a1a1a" stroke-width="1.6" stroke-linecap="round"/>'+
        '</svg>';
      bugsEl.appendChild(b);
    }
    setTimeout(function(){ bugsEl.innerHTML = ''; bugsOn = false; }, 4400);
  }

/* tigOS core app.js, part 13: pets. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------------- pets (terminal: pet cat | dog | cow | penguin | ladybug | aki | off) ----------------
     Art lives in pets.js (TIG_PETS). Behaviour is a tiny state machine: exactly one mood at a time, the next action is only
     scheduled once the current mood has finished (so nothing can walk while asleep), and wandering stays within a home
     radius of wherever the user last dropped the pet. */
  var petsEl = $('#pets');
  var PETS = window.TIG_PETS || {};
  var PET_ALIAS = { tiger:'tiger', tig:'tiger', rawr:'tiger', ladybug:'ladybug', bug:'ladybug', hailey:'ladybug', penguin:'penguin', pip:'penguin', cow:'cow', moo:'cow', dog:'dog', shepherd:'dog', 'german shepherd':'dog', germanshepherd:'dog', gsd:'dog', khloe:'dog', 'khlo\u00e9':'dog', puppy:'dog', cat:'cat', kitty:'cat', goob:'cat', aki:'aki', robot:'aki', bot:'aki' };
  var PET = { el:null, t:0, face:1, mood:'', home:0, busy:false }, petBin = $('#petBin');
  var PET_HOME = 130;   /* max px a pet wanders from where it was put down */
  function petEl(){ return $('.pet', petsEl); }
  function petApply(){
    var want = PREF.pet, cur = petEl();
    if(!want || !PETS[want]){ if(!PETS[want]) PREF.pet = ''; if(cur){ cur.remove(); } PET.el = null; clearTimeout(PET.t); return; }
    if(cur && cur.getAttribute('data-pet') === want) return;
    if(cur) cur.remove();
    var pt = PETS[want], el = document.createElement('div');
    el.className = 'pet'; el.setAttribute('data-pet', want); el.setAttribute('title', pt.name+' the '+pt.label);
    el.innerHTML = '<span class="shadow"></span><span class="body"><span class="art">'+pt.svg+'</span></span><span class="zz"><i>z</i><i>z</i><i>z</i></span><span class="hearts"><i>\u2665</i><i>\u2665</i><i>\u2665</i></span><span class="say"></span><span class="pname">'+esc(pt.name)+'</span>';
    petsEl.appendChild(el);
    var W = root.clientWidth, H = root.clientHeight, sz = el.offsetWidth || 112;
    el.style.left = Math.max(8, W - sz - 36)+'px';
    el.style.top = Math.max(48, H - sz - (isMobile() ? 104 : 112))+'px';
    PET.el = el; PET.face = 1; PET.mood = ''; PET.busy = false; PET.home = el.offsetLeft; petDrag(el); petLoop();
  }
  var MOODS = ['walk', 'nap', 'hop', 'look', 'trick', 'say', 'sit', 'scratch', 'abduct'];
  function petClear(el){ MOODS.forEach(function(m){ el.classList.remove(m); }); el.classList.remove('drop'); }
  function petLoop(ms){ clearTimeout(PET.t); if(!PET.el) return; PET.t = setTimeout(petAct, ms != null ? ms : 1800 + Math.random()*3200); }
  /* run one mood for ms, then idle briefly, then pick the next one. Nothing else can start while busy. */
  function petMood(cls, ms, after){
    var el = PET.el; if(!el || PET.busy) return false;
    PET.busy = true; PET.mood = cls; el.classList.add(cls);
    clearTimeout(PET.t);
    PET.t = setTimeout(function(){ if(el.parentNode) el.classList.remove(cls); PET.busy = false; PET.mood = ''; if(after) after(); if(PET.el === el) petLoop(); }, ms);
    return true;
  }
  function petSay(txt, ms){ var el = PET.el; if(!el) return; var b = $('.say', el); b.textContent = txt; el.classList.add('talk'); clearTimeout(PET.sayT); PET.sayT = setTimeout(function(){ el.classList.remove('talk'); }, ms || 1800); }
  function petWalk(){
    var el = PET.el; if(!el || PET.busy) return false;
    var rr = root.getBoundingClientRect(), w = el.offsetWidth, x = el.offsetLeft;
    var lo = Math.max(0, PET.home - PET_HOME), hi = Math.min(rr.width - w, PET.home + PET_HOME);
    var nx = lo + Math.random()*(hi - lo), dist = nx - x;
    if(Math.abs(dist) < 28) return false;
    PET.face = dist < 0 ? -1 : 1; el.style.setProperty('--face', PET.face);
    var speed = el.getAttribute('data-pet') === 'aki' ? 60 : 44, dur = Math.abs(dist)/speed;
    el.style.setProperty('--wd', dur.toFixed(2)+'s');
    petMood('walk', dur*1000 + 60);
    el.style.left = nx+'px';
    return true;
  }
  function petAct(){
    var el = PET.el; if(!el){ return; }
    if(PET.busy || el.classList.contains('drag') || PREF.motion === 'off' || document.hidden || !$('#sleep').hidden || root.classList.contains('poweroff')){ petLoop(1200); return; }
    var kind = el.getAttribute('data-pet'), pt = PETS[kind] || {}, r = Math.random();
    if(kind === 'cow' && r < .04){ petUfo(el); return; }                         /* rare: abducted, then dropped back off */
    if(r < .30){ if(!petWalk()) petLoop(600); }
    else if(r < .44) petMood('look', 1700);
    else if(r < .54) petMood('hop', 700);
    else if(r < .64) petMood('nap', 7000 + Math.random()*6000);
    else if(r < .76) petMood('trick', kind === 'ladybug' ? 1900 : 1700);
    else if(r < .86){ petMood('say', 1900); petSay((pt.say || ['\u2665'])[Math.floor(Math.random()*(pt.say || [1]).length)], 1800); }
    else if(r < .94) petMood('sit', 3200 + Math.random()*2400);
    else petMood('scratch', 1400);
  }
  /* the cow's UFO: saucer descends, beam, cow rises and vanishes, saucer leaves; 2.4s later it returns and drops the cow back on the same spot */
  var ufoEl = null;
  function petUfo(el, forGood){
    if(PET.busy && !forGood) return; PET.busy = true; PET.mood = 'abduct';
    clearTimeout(PET.t);
    if(ufoEl) ufoEl.remove();
    ufoEl = document.createElement('div'); ufoEl.className = 'ufo'; ufoEl.innerHTML = window.TIG_UFO || ''; petsEl.appendChild(ufoEl);
    var w = el.offsetWidth, uw = w*1.8, rr = root.getBoundingClientRect(), cx = el.offsetLeft + w/2, top = el.offsetTop;
    ufoEl.style.width = uw+'px'; ufoEl.style.left = Math.max(4, Math.min(rr.width - uw - 4, cx - uw/2))+'px'; ufoEl.style.top = Math.max(-10, top - w*0.98)+'px';
    el.classList.add('abduct');
    ufoEl.classList.add('arrive');
    setTimeout(function(){ if(!ufoEl) return; ufoEl.classList.add('beam'); el.classList.add('beamed'); }, 900);
    setTimeout(function(){ if(!ufoEl) return; ufoEl.classList.remove('beam'); ufoEl.classList.add('leave'); }, 2300);
    setTimeout(function(){
      if(!ufoEl) return;
      if(forGood){ ufoEl.remove(); ufoEl = null; el.remove(); PET.el = null; PET.busy = false; PREF.pet = ''; applyPrefs(); petUIs(); return; }
      ufoEl.classList.remove('leave', 'arrive'); void ufoEl.offsetWidth;
      setTimeout(function(){ if(!ufoEl) return; ufoEl.classList.add('arrive'); setTimeout(function(){ if(!ufoEl) return; ufoEl.classList.add('beam'); el.classList.remove('beamed'); el.classList.add('returned'); }, 800);
        setTimeout(function(){ if(!ufoEl) return; ufoEl.classList.remove('beam'); ufoEl.classList.add('leave'); el.classList.remove('abduct', 'returned'); el.classList.add('drop'); setTimeout(function(){ el.classList.remove('drop'); }, 560); petSay('moo?!', 2000); }, 1900);
        setTimeout(function(){ if(ufoEl){ ufoEl.remove(); ufoEl = null; } PET.busy = false; PET.mood = ''; if(PET.el === el) petLoop(); }, 3100); }, 2400);
    }, 3100);
  }
  function petDrag(el){
    var on = false, ox = 0, oy = 0, moved = false, hot = false;
    var overBin = function(){ var b = petBin.getBoundingClientRect(), r = el.getBoundingClientRect(), cx = r.left + r.width/2, cy = r.top + r.height/2; return cx > b.left - 24 && cx < b.right + 24 && cy > b.top - 24 && cy < b.bottom + 24; };
    el.addEventListener('pointerdown', function(e){
      if(el.classList.contains('poof') || el.classList.contains('abduct')) return;
      on = true; moved = false; hot = false;
      var r = el.getBoundingClientRect();
      ox = e.clientX - r.left; oy = e.clientY - r.top;
      clearTimeout(PET.t); petClear(el); PET.busy = false; PET.mood = ''; el.classList.add('drag'); root.classList.add('pet-dragging');
      el.setPointerCapture(e.pointerId); e.preventDefault();
    });
    el.addEventListener('pointermove', function(e){
      if(!on) return; moved = true;
      var rr = root.getBoundingClientRect(), w2 = el.offsetWidth, h2 = el.offsetHeight;
      el.style.left = Math.max(-w2*.3, Math.min(rr.width - w2*.7, e.clientX - rr.left - ox))+'px';
      el.style.top = Math.max(30, Math.min(rr.height - h2*.6, e.clientY - rr.top - oy))+'px';
      var h = overBin(); if(h !== hot){ hot = h; petBin.classList.toggle('hot', h); el.classList.toggle('doomed', h); }
    });
    var end = function(){
      if(!on) return; on = false; el.classList.remove('drag'); root.classList.remove('pet-dragging'); petBin.classList.remove('hot');
      if(hot){ hot = false; el.classList.remove('doomed'); petGoodbye(el); return; }
      el.classList.remove('doomed');
      if(moved){ el.classList.add('drop'); setTimeout(function(){ el.classList.remove('drop'); }, 560); var rr = root.getBoundingClientRect(); el.style.left = Math.max(0, Math.min(rr.width - el.offsetWidth, el.offsetLeft))+'px'; PET.home = el.offsetLeft; }
      else { el.classList.remove('happy'); void el.offsetWidth; el.classList.add('happy'); setTimeout(function(){ el.classList.remove('happy'); }, 1400); }
      petLoop();
    };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  }
  function petGoodbye(el){
    var kind = el.getAttribute('data-pet'), pt = PETS[kind] || { name:'Your pet' };
    clearTimeout(PET.t);
    toast('Bye, '+pt.name, 'Type pet in the Terminal whenever you want company again.', 'heart');
    if(kind === 'cow'){                                                   /* the cow gets beamed up instead of poofing: step clear of the corner first */
      PET.busy = false; var rr = root.getBoundingClientRect(), w = el.offsetWidth;
      var tx = Math.max(w*.6, Math.min(rr.width - w*1.6, el.offsetLeft - w*1.3)), ty = Math.max(48, Math.min(rr.height - w*1.9, el.offsetTop - w*.6));
      el.style.setProperty('--wd', '.55s'); el.classList.add('walk', 'flee'); el.style.setProperty('--face', -1); el.style.left = tx+'px'; el.style.top = ty+'px';
      setTimeout(function(){ el.classList.remove('walk', 'flee'); petUfo(el, true); }, 620);
      return;
    }
    el.classList.add('poof'); PET.el = null;
    setTimeout(function(){ PREF.pet = ''; applyPrefs(); petUIs(); }, 430);
  }
  function petUIs(){ var sw = WM.wins.settings; if(sw) RENDER.settings(sw); var pw = WM.wins.pets; if(pw) RENDER.pets(pw); }   /* every surface that shows the pet state redraws together */
  function petSet(name){
    PREF.pet = name || ''; applyPrefs();
    petUIs();
    return PREF.pet;
  }

  var eggT = {};
  function eggShow(id){ var e = $('#'+id); e.hidden = false; clearTimeout(eggT[id]); eggT[id] = setTimeout(function(){ e.hidden = true; }, 5000); }
  $$('.egg').forEach(function(e){ e.addEventListener('click', function(){ e.hidden = true; clearTimeout(eggT[e.id]); }); });

  var TIGER = [
    '      /\\  _  /\\      ',
    '     /  \\/ \\/  \\     ',
    '    | |\\  _  /| |    ',
    '    | | \\/ \\/ | |    ',
    '   /|   O   O   |\\   ',
    '  | |  \\  V  /  | |  ',
    '   \\| ( .___. ) |/   ',
    '     \\__\\|_|/__/     '
  ];
  var TIGOS_WORD = [
    ' _   _        ___  ____  ',
    '| |_(_) __ _ / _ \\/ ___| ',
    '| __| |/ _` | | | \\___ \\ ',
    '| |_| | (_| | |_| |___) |',
    ' \\__|_|\\__, |\\___/|____/ ',
    '       |___/             '
  ];
  var TUX = [
    '    .--.    ', '   |o_o |   ', '   |:_/ |   ', '  //   \\ \\  ', ' (|     | ) ', "/'\\_   _/`\\ ", '\\___)=(___/ '
  ];
  var COW = function(msg){ var l = msg.length; return [' '+'_'.repeat(l+2), '< '+msg+' >', ' '+'-'.repeat(l+2), '        \\   ^__^', '         \\  (oo)\\_______', '            (__)\\       )\\/\\', '                ||----w |', '                ||     ||']; };
  var FORTUNES = ['Clear beats clever. Every time.', 'The best campaign is the one people can explain to a friend.', 'You will ship something today. Probably a deck.', 'A brief without a metric is a wish.', 'Ask the customer. Then ask again.', 'Nothing converts like a good headline and a short form.'];

  RENDER.terminal = function(w){
    var ps1 = function(){ return USER.name === 'greggyd' ? 'greggyd@tigos:~$' : USER.name+'@tigos ~ '+USERS[USER.name].shell; };
    var prompt = function(){ return '<span class="p">'+ps1()+'</span>'; };
    w.body.innerHTML = '<div class="term" id="termBody"><div class="line dim">tigOS 2.0 \u2014 type <span class="o">help</span> and press return.</div><div class="in"><span class="p" id="termP"></span><span class="tinw"><input id="termIn" type="text" autocomplete="off" spellcheck="false" aria-label="Terminal input"><span class="ghost" aria-hidden="true"><span class="gv" id="termGv"></span><i class="tcur" id="termCur"></i></span></span></div></div>';
    var body = $('#termBody', w.el), inp = $('#termIn', w.el), pEl = $('#termP', w.el), gv = $('#termGv', w.el);
    var syncCur = function(){ var n = inp.selectionStart == null ? inp.value.length : inp.selectionStart; gv.textContent = inp.type === 'password' ? '\u2022'.repeat(n) : inp.value.slice(0, n); };   /* the block sits at the caret, not at the end, so left/right arrows move it between letters */
    var syncSoon = function(){ requestAnimationFrame(syncCur); };
    inp.addEventListener('input', syncCur); inp.addEventListener('keyup', syncCur); inp.addEventListener('keydown', syncSoon); inp.addEventListener('select', syncCur); inp.addEventListener('pointerup', syncSoon); inp.addEventListener('focus', syncSoon); syncCur();
    var mode = null;   // { kind:'pw', user:'ariel', tries:n }
    var hist = [], hi = 0, draft = '';   // up/down arrow history
    var refreshPrompt = function(){ pEl.innerHTML = mode ? '<span class="dim">Password for '+mode.user+':</span>' : ps1(); inp.type = mode ? 'password' : 'text'; syncCur(); };
    refreshPrompt();
    var print = function(html, cls){ var d = document.createElement('div'); d.className = 'line '+(cls||''); d.innerHTML = html; body.insertBefore(d, $('.in', body)); body.parentNode.scrollTop = 1e9; };
    var art = function(lines, cls){ print(lines.map(esc).join('\n'), 'art'+(cls ? ' '+cls : '')); };
    var o = function(t){ return '<span class="o">'+t+'</span>'; };
    var login = function(name){
      setUser(name); refreshPrompt();
      if(name === 'ariel'){ print('Welcome back, ariel. Everything is pink now.', 'ok'); toast('i love you!', 'ariel@tigos is logged in'); }
      if(name === 'greggyd'){ art(TUX); print('Welcome to Ubuntu 24.04 LTS (GNU/Linux 6.9.0-tigos x86_64)\n\n * Documentation:  help\n * Support:        hire\n\n0 updates can be applied immediately. You have mail.', 'ok'); toast('Tux has entered the chat', 'greggyd@tigos is logged in'); }
      if(name === 'chase'){ print('Welcome back, chase.', 'ok'); }
    };
    var CMD = {
      help: function(){
        print('portfolio:  '+['about','experience','journey','projects','skills','resume','contact','open &lt;app&gt;'].map(o).join('  '));
        print('system:     '+['neofetch','weather','uptime','users','su &lt;user&gt;','settings','theme light|dark','clear','exit'].map(o).join('  '));
        print('this is a real enough shell. most unix, mac, linux and windows commands do something. explore.', 'dim');
      },
      weather: function(arg){
        var q = (arg || '').trim().toLowerCase(), c = CITY;
        if(q){ var m = CITIES.filter(function(x){ return x.name.toLowerCase() === q || x.short.toLowerCase() === q || x.id === q; })[0]; if(!m){ print('no city called '+esc(q)+'. try: '+CITIES.map(function(x){ return o(x.short.toLowerCase()); }).join(' '), 'err'); return; } c = m; }
        var line = document.createElement('div'); line.className = 'line'; line.innerHTML = '<span class="dim">fetching '+esc(c.name)+'\u2026</span>'; body.insertBefore(line, $('.in', body));
        var render = function(w){
          if(!w){ line.innerHTML = '<span class="err">weather for '+esc(c.name)+' is not available right now.</span>'; return; }
          var glyph = { sun:'\u2600', moon:'\u263E', partly:'\u26C5', cloud:'\u2601', fog:'\u2592', rain:'\u2614', snow:'\u2744', storm:'\u26A1' }[w.now.kind] || '\u2600';
          var days = w.days.map(function(d){ return '  '+esc(d.d).padEnd(5, ' ')+' '+esc(WX_LABEL[d.k] || d.k).padEnd(15, ' ')+'  '+o(d.hi+'\u00b0')+' / '+d.lo+'\u00b0'; });
          line.className = 'line wx'; line.innerHTML = '<span class="wx-g">'+glyph+'</span> '+o(esc(c.name))+'  '+w.now.t+'\u00b0F  '+esc(w.now.label)+(days.length ? '\n'+days.join('\n') : '')+'\n<span class="dim">'+(c === CITY ? 'weather &lt;city&gt; for somewhere else. ' : 'your clock stays on '+esc(CITY.name)+'. ')+'source: open-meteo.</span>';
          body.parentNode.scrollTop = 1e9;
        };
        if(c === CITY && WX.now) render({ now:WX.now, days:WX.days }); else wxFetch(c).then(render);
      },
      wx: function(a){ CMD.weather(a); }, forecast: function(a){ CMD.weather(a); }, temp: function(a){ CMD.weather(a); },
      game: function(arg){ arcade(function(){ CMD._game(arg); }); },   /* hidden from help on purpose: an arcade you find by poking around */
      _game: function(arg){
        var a = (arg || '').trim().toLowerCase();
        if(!a || a === 'list' || a === 'ls' || a === '-l' || a === 'help'){ print('tigOS arcade  \u00b7  '+GAMES.length+' games, all built into this page'); GAMES.forEach(function(g, i){ if(g.premium && (!GAMES[i-1] || !GAMES[i-1].premium)) print('premium arcade games', 'dim'); print(o(String(i+1).padStart(2, ' '))+'  '+o(g.id.padEnd(10, ' '))+' '+esc(g.name).padEnd(12, ' ')+' <span class="dim">'+esc(g.blurb)+'</span>'); }); print('game &lt;name&gt; starts one. p pauses, r restarts, the green light goes full screen, esc comes back.', 'dim'); return; }
        var g = gameById(a); if(!g){ print('no game called '+esc(a)+'. try: '+GAMES.map(function(x){ return o(x.id); }).join(' '), 'err'); return; }
        open('games', { route:g.id }); print('launching '+o(esc(g.name))+'  \u00b7  '+esc(g.keys)+'. '+o('p')+' pauses, '+o('r')+' restarts.');
      },
      games: function(a){ CMD.game(a); }, play: function(a){ CMD.game(a); }, arcade: function(a){ CMD.game(a); },
      pets: function(a){ if((a || '').trim()){ CMD.pet(a); return; } open('pets'); print('opening Pets  \u00b7  pick one to bring it out, drag it anywhere, drop it on the X to say goodbye.'); },
      whoami: function(){ if(USER.name === 'chase') print(esc(P.name)+' \u2014 '+esc(P.title)+', '+esc(P.company)+'. '+esc(P.location)+'.'); else print(USER.name+' (uid=50'+(USER.name === 'ariel' ? '2' : '3')+') \u2014 guest of tigOS.'); },
      about: function(){ print(esc(P.summary)); },
      experience: function(){ TIG.experience.forEach(function(j){ print(o(esc(j.company))+'  '+esc(j.role)+'  <span class="dim">'+esc(j.dates)+'</span>'); }); },
      projects: function(){ TIG.projects.forEach(function(p){ print(o(p.n)+'  '+esc(p.name)+'  <span class="dim">'+esc(p.company)+'</span>'); }); print('tip: '+o('open projects'), 'dim'); },
      skills: function(){ TIG.skills.groups.forEach(function(g){ print(o(esc(g.name)+':')+' '+g.items.map(esc).join(' \u00b7 ')); }); },
      education: function(){ print(esc(TIG.education.school)+' \u2014 '+esc(TIG.education.degree)+' ('+esc(TIG.education.year)+')'); },
      contact: function(){ print(esc(TIG.contact.email)+'  \u00b7  '+esc(TIG.contact.phone)+'  \u00b7  '+esc(TIG.contact.linkedinLabel)); },
      stats: function(){ TIG.stats.forEach(function(s){ print(o(esc(s.big))+'  '+esc(s.label)+'  <span class="dim">'+esc(s.sub)+'</span>'); }); },
      resume: function(){ open('resume'); print('opening Resume.app'); },
      journey: function(a){ open('journey', a ? { route:a } : {}); TIG.journey.forEach(function(s, i){ var c = TIG.cities[s.city]; print(o(i+1)+'  '+esc(c.city)+', '+esc(c.state)+'  <span class="dim">'+esc(s.years)+'</span>  '+esc(s.company)); }); }, map: function(){ CMD.journey(); }, travel: function(){ CMD.journey(); },
      open: function(arg){ if(arg === '.' || arg === '') { print('opening Finder\u2026 just kidding, this is a portfolio.'); return; } if(APPS[arg]){ open(arg); print('opening '+arg); } else print('no app named "'+esc(arg)+'". try: '+VIS().join(', ')); },
      clear: function(){ $$('.line', body).forEach(function(l){ l.remove(); }); },
      users: function(){ print(Object.keys(USERS).map(function(u){ return (u === USER.name ? o(u)+' <span class="dim">(you)</span>' : u); }).join('   ')); print('switch with '+o('su &lt;user&gt;'), 'dim'); },
      su: function(arg){
        var u = (arg || 'chase').replace(/^-\s*/, '').trim().toLowerCase();
        if(u === 'root' || u === 'admin'){ print('su: root is disabled on tigOS. chase is the admin.', 'err'); return; }
        if(!USERS[u]){ print('su: user '+esc(u)+' does not exist', 'err'); return; }
        if(u === USER.name){ print('su: you are already '+u+'.', 'dim'); return; }
        if(u === 'chase'){ login('chase'); return; }
        mode = { kind:'pw', user:u, tries:0 }; refreshPrompt();
      },
      logout: function(){ print('logging out '+USER.name+'\u2026'); setTimeout(loginScreen, 400); },
      exit: function(){ CMD.logout(); },
      sudo: function(arg){ if(/make me a sandwich/i.test(arg)) { print('okay.'); return; } print(USER.name === 'chase' ? 'nice try. chase is already the admin here.' : USER.name+' is not in the sudoers file. This incident will be reported.', 'err'); },
      ls: function(arg){ var f = VIS().map(function(k){ return k+'.app'; }); if(/-l|-la|-al/.test(arg)){ f.forEach(function(x){ print('drwxr-xr-x  '+USER.name+'  staff   4096  Sep  3 14:00  '+x); }); print('-rw-r--r--  '+USER.name+'  staff  117396  Sep  3 14:00  resume.pdf'); } else print(f.join('  ')+'  resume.pdf'); },
      dir: function(a){ CMD.ls(a); },
      pwd: function(){ print(USERS[USER.name].home+'/tigos'); },
      cd: function(arg){ print(arg && arg !== '~' ? 'cd: '+esc(arg)+': this is a one-directory kind of place' : ''); },
      cat: function(arg){ if(/resume/.test(arg)){ open('resume'); print('binary file. opening Resume.app instead.'); } else if(/\.env|passwd|shadow/.test(arg)){ print('cat: '+esc(arg)+': permission denied. nice try though.', 'err'); } else print('cat: '+esc(arg||'')+': no such file. try '+o('ls')); },
      rm: function(arg){ if(/-rf\s+\/|\*|~/.test(arg)){ print('rm: refusing to remove everything. Chase worked hard on this.', 'err'); toast('Phew', 'rm -rf / has been politely declined.'); } else print('rm: '+esc(arg||'')+': operation not permitted'); },
      mkdir: function(){ print('mkdir: read-only file system (it\u2019s a portfolio)'); }, touch: function(){ print('touch: read-only file system'); },
      echo: function(arg){ print(esc(arg.replace(/^["']|["']$/g, '')) || ''); },
      date: function(){ print(new Date().toString()); },
      uptime: function(){ var s = Math.round(performance.now()/1000); print('up '+Math.floor(s/60)+' min '+(s%60)+' sec, 1 user, load averages: 0.42 0.42 0.42'); },
      neofetch: function(){
        /* tiger face on the left, tigOS wordmark on the right (wordmark drops on narrow phones) */
        var rows = [], n = Math.max(TIGER.length, TIGOS_WORD.length), wide = body.clientWidth > 560;
        for(var i = 0; i < n; i++){ var l = TIGER[i] || ' '.repeat(TIGER[0].length), r = TIGOS_WORD[i - 1] || ''; rows.push(wide ? l+'  '+r : l); }
        print(rows.map(function(row, i){ var cut = TIGER[0].length; return '<span class="tig">'+esc(row.slice(0, cut))+'</span><span class="word">'+esc(row.slice(cut))+'</span>'; }).join('\n'), 'art logo');
        var up = Math.round(performance.now()/1000), wins = Object.keys(WM.wins), pet = PREF.pet && PETS[PREF.pet];
        var cap = function(x){ return x.charAt(0).toUpperCase()+x.slice(1); };
        print(o('OS')+': tigOS 2.0 (portfolio edition)\n'+o('Host')+': chasetiger.com\n'+o('Kernel')+': vanilla-js 1.0\n'+o('Shell')+': '+(USER.name === 'greggyd' ? 'bash' : 'tigsh')+'\n'+
          o('Uptime')+': '+Math.floor(up/60)+' min '+(up%60)+' sec\n'+o('Resolution')+': '+root.clientWidth+'x'+root.clientHeight+(isMobile() ? ' (phone)' : '')+'\n'+
          o('Theme')+': '+(PREF.theme === 'light' ? 'Light' : 'Dark')+' \u00b7 '+cap(PREF.accent)+' accent\n'+o('Text')+': '+PREF.text.toUpperCase()+'  '+o('Dock')+': '+PREF.dock+(PREF.dockpos !== 'bottom' ? ' \u00b7 '+PREF.dockpos : '')+(PREF.dockhide === 'on' ? ' \u00b7 auto-hide' : '')+'\n'+
          o('Cursor')+': '+PREF.cursor+'  '+o('Motion')+': '+(PREF.motion === 'off' ? 'reduced' : 'on')+'\n'+
          o('Windows')+': '+(wins.length ? wins.join(', ') : 'none')+'\n'+o('Pet')+': '+(pet ? pet.name+' the '+pet.label : 'none (try pet cat)')+'\n'+
          o('City')+': '+CITY.name+(WX.now ? ' \u00b7 '+WX.now.t+'\u00b0 '+WX.now.label : '')+'\n'+o('User')+': '+USER.name);
      },
      fortune: function(){ print(FORTUNES[Math.floor(Math.random()*FORTUNES.length)]); },
      cowsay: function(arg){ art(COW(arg || 'moo')); },
      sl: function(){ art(['      ====        ________', '  _D _|  |_______/        \\__I_I_____===__|_________|', '   |(_)---  |   H\\________/ |   |        =|___ ___|', '   /     |  |   H  |  |     |   |         ||_| |_||', '  |      |  |   H  |__--------------------| [___] |', '  | ________|___H__/__|_____/[][]~\\_______|       |', '  |/ |   |-----------I_____I [][] []  D   |=======|__']); print('you meant ls. we both know it.', 'dim'); },
      vim: function(){ print('vim: opened. good luck getting out. (hint: :q!)'); }, vi: function(){ CMD.vim(); }, nano: function(){ print('nano: too easy. try vim.'); }, emacs: function(){ print('emacs: this terminal has a 4 MB limit.'); },
      ':q': function(){ print('you\u2019re free.'); }, ':q!': function(){ print('you\u2019re free.'); }, ':wq': function(){ print('saved nothing, exited anyway.'); },
      man: function(arg){ print(arg ? 'No manual entry for '+esc(arg)+'. Chase writes the docs here, and he wrote '+o('help')+'.' : 'What manual page do you want?'); },
      history: function(){ if(!hist.length){ print('history is empty. type something first.', 'dim'); return; } print(hist.map(function(h, i){ return '  '+String(i+1).padStart(String(hist.length).length, ' ')+'  '+esc(h); }).join('\n')); },
      top: function(){ print('PID   COMMAND        %CPU  MEM\n1     tigos          0.4   12M\n2     coffee         98.0  \u221e\n3     marketing      42.0  4x'); }, htop: function(){ CMD.top(); },
      ping: function(arg){ print('PING '+esc(arg||'chasetiger.com')+': 64 bytes: icmp_seq=0 ttl=64 time=0.042 ms\n--- 1 packets transmitted, 1 received, 0% loss. we\u2019re good.'); },
      ssh: function(arg){ print('ssh: connect to host '+esc(arg||'?')+': the only way in is the dock.', 'err'); },
      curl: function(arg){ print('curl: (7) '+esc(arg||'')+' \u2014 this box is offline by design. try '+o('contact')+'.'); }, wget: function(a){ CMD.curl(a); },
      git: function(arg){ var c = (arg||'').split(' ')[0]; if(c === 'status') print('On branch main\nnothing to commit, working tree clean (Chase ships).'); else if(c === 'push') print('Everything up-to-date'); else if(c === 'blame') print('it was marketing.'); else print('git: ask nicely. try '+o('git status')); },
      npm: function(){ print('added 1,204 packages in 0.3s (none of them needed)'); }, yarn: function(){ CMD.npm(); }, pip: function(){ print('Successfully installed confidence-1.0'); }, brew: function(){ print('\u{1F37A}  brew: everything is already up to date.'); }, apt: function(a){ if(USER.name === 'greggyd'){ print('Reading package lists... Done\nBuilding dependency tree... Done\nAll packages are up to date. (as if)'); } else print('E: Could not open lock file. Chase has it.'); }, 'apt-get': function(){ CMD.apt(); },
      python: function(){ print('Python 3.12.0\n>>> print("hire chase")\nhire chase\n>>> exit()'); }, python3: function(){ CMD.python(); }, node: function(){ print('> [1,2,3].map(x => "clear")\n[ \'clear\', \'clear\', \'clear\' ]'); },
      cls: function(){ CMD.clear(); }, ipconfig: function(){ print('Windows IP Configuration\n\n   IPv4 Address. . . . . . : 127.0.0.1 (you are home)'); }, ifconfig: function(){ CMD.ipconfig(); },
      chmod: function(){ print('chmod: permissions are perfect already.'); }, kill: function(){ print('kill: nothing here deserves it.'); }, killall: function(){ CMD.kill(); },
      reboot: function(){ print('rebooting\u2026'); setTimeout(restart, 500); }, shutdown: function(){ print('shutting down\u2026'); setTimeout(powerOff, 600); },
      sleep: function(){ print('going to sleep\u2026'); setTimeout(function(){ $('#sleep').hidden = false; saverStart(); tick(); }, 500); },
      say: function(arg){ print('\u{1F5E3} '+esc(arg||'hello')); },
      hello: function(){ print('hi there. type '+o('help')+' if you want the map.'); }, hi: function(){ CMD.hello(); }, hey: function(){ CMD.hello(); },
      coffee: function(){ print('\u2615  brewing. estimated time: as long as it takes.'); },
      matrix: function(){ print('there is no spoon.', 'ok'); }, hack: function(){ print('ACCESS GRANTED. just kidding. it\u2019s a marketing site.', 'ok'); },
      cal: function(){ var d = new Date(); print(d.toLocaleString('en-US', { month:'long', year:'numeric' })+'\n Su Mo Tu We Th Fr Sa\n ...it\u2019s the '+d.getDate()+'th. probably a good day to email chase.'); },
      hire: function(){ open('contact'); print('good call. opening Contact.', 'ok'); },
      bug: function(){ bugsRun(); print('\u{1F41E} You found Hailey Bug! Look out\u2026', 'ok'); },
      bugs: function(){ CMD.bug(); }, ladybug: function(){ CMD.bug(); },
      pet: function(arg){
        var a = (arg || '').trim().toLowerCase();
        if(!a){ print('pets: '+Object.keys(PETS).map(function(k){ return o(k)+' <span class="dim">('+PETS[k].name+')</span>'; }).join('  ')); print('usage: '+o('pet cat')+'  \u00b7  '+o('pet off')+' to send them home  \u00b7  '+o('pets')+' opens the window. Drag a pet anywhere on screen.', 'dim'); return; }
        if(a === 'ui' || a === 'window' || a === 'app' || a === 'list'){ CMD.pets(); return; }
        if(/^(off|none|no|bye|stop|away)$/.test(a)){ if(!PREF.pet){ print('no pet is out right now.', 'dim'); return; } var was = PETS[PREF.pet], wasKey = PREF.pet, pel = petEl(); if(pel) petGoodbye(pel); else petSet(''); print(wasKey === 'cow' ? was.name+' gets beamed up. she will be fine, probably.' : wasKey === 'aki' ? was.name+' powers down. beep.' : was.name+' waddles off. come back soon.', 'ok'); return; }
        var key = PET_ALIAS[a];
        if(!key){ print('no pet called '+esc(a)+'. try: '+Object.keys(PETS).map(o).join(', '), 'err'); return; }
        petSet(key); var pt = PETS[key];
        print(pt.name+' the '+pt.label+' pops in, bottom right. drag them around \u2014 they stay close to wherever you put them.', 'ok');
        toast(pt.name+' is here', 'Drag your '+pt.label+' anywhere, tap for hearts. Drop onto the X to say goodbye.', 'heart');
      },

      tour: function(){ print('starting the tour\u2026 your windows step aside and come back when it ends.', 'ok'); setTimeout(tourStart, 250); },
      cursor: function(a){
        var v = (a || '').trim().toLowerCase();
        if(isMobile()){ print('cursor styles are a desktop thing.', 'dim'); return; }
        if(!/^(block|line|bar|beam|underline|under)$/.test(v)){ print('usage: '+o('cursor block')+' | '+o('cursor line')+' | '+o('cursor underline')+'  (now: '+PREF.cursor+')'); return; }
        var k = /^(line|bar|beam)$/.test(v) ? 'line' : /^(under|underline)$/.test(v) ? 'underline' : 'block';
        setPref('cursor', k); print('cursor: '+k, 'ok');
      },
      settings: function(){ open('settings'); print('opening Settings'); }, prefs: function(){ CMD.settings(); }, theme: function(a){ if(/light|dark/i.test(a)){ setPref('theme', a.toLowerCase().match(/light|dark/)[0]); print('appearance: '+PREF.theme); } else print('usage: theme light | theme dark'); },
      tigos: function(){ print('tigOS 2.0 \u2014 built by Chase Johnston. A portfolio that pretends to be an operating system, because a PDF felt boring.'); },
      /* ---- the wider unix / mac / linux / windows / bash surface: everything here does *something* ---- */
      sw_vers: function(){ print('ProductName:\t\ttigOS\nProductVersion:\t\t2.0\nBuildVersion:\t\t26A'+new Date().getDate()); },
      system_profiler: function(){ print('Hardware Overview:\n  Model Name: Portfolio\n  Chip: Vanilla JS\n  Memory: as much as your tab allows\n  Serial Number: CHASE-2026'); },
      defaults: function(a){ if(/write/.test(a)) print('defaults: use Settings for that. '+o('settings')); else print('{\n    theme = '+PREF.theme+';\n    accent = '+PREF.accent+';\n    dock = '+PREF.dock+';\n}'); },
      softwareupdate: function(){ print('Software Update Tool\n\nFinding available software\nNo new software available. (Chase ships continuously.)'); },
      diskutil: function(){ print('/dev/disk0 (internal):\n   #:  TYPE NAME       SIZE\n   0:  tigOS Portfolio  822 KB\n   1:  Resume            117 KB'); },
      caffeinate: function(){ print('\u2615 caffeinate: this site never sleeps. unless you tell it to. ('+o('sleep')+')'); },
      screencapture: function(){ print('screencapture: saved to ~/Desktop/Screenshot '+new Date().toLocaleDateString()+'.png (it is the whole portfolio)'); },
      mdfind: function(a){ print(a ? 'mdfind: try '+o('\u2318K')+' \u2014 that is Spotlight here.' : 'usage: mdfind <query>'); },
      launchctl: function(){ print('PID\tStatus\tLabel\n1\t0\tcom.chase.tigos\n42\t0\tcom.chase.coffee'); },
      osascript: function(){ print('execution error: this portfolio does not do AppleScript, but it does do '+o('say hello')); },
      'xcode-select': function(){ print('xcode-select: note: no developer tools were found. this is a marketing site.'); },
      pbcopy: function(){ print('copied to the clipboard. (not really, but '+o('contact')+' has a real copy button.)'); }, pbpaste: function(){ print('hire chase'); },
      df: function(){ print('Filesystem      Size   Used  Avail  Use%  Mounted on\n/dev/tigos     822K   822K     0K  100%  /'); }, du: function(){ print('822K\t.'); }, free: function(){ print('               total        used        free\nMem:         \u221e           some        plenty'); },
      ps: function(){ CMD.top(); }, pstree: function(){ print('tigos\u2500\u252c\u2500dock\n     \u251c\u2500menubar\n     \u2514\u2500terminal\u2500\u2500you'); },
      grep: function(a){ print(a ? 'grep: '+esc(a.split(' ')[0])+': found in every project on this site.' : 'usage: grep [pattern]'); }, egrep: function(a){ CMD.grep(a); }, fgrep: function(a){ CMD.grep(a); }, rg: function(a){ CMD.grep(a); }, ag: function(a){ CMD.grep(a); },
      find: function(a){ print(/resume/.test(a) ? './resume.pdf' : './'+VIS().join('.app\n./')+'.app'); }, locate: function(a){ CMD.find(a); }, fd: function(a){ CMD.find(a); },
      which: function(a){ var c = (a||'').split(' ')[0]; print(c ? (CMD[c] ? '/usr/bin/'+esc(c) : esc(c)+' not found') : 'usage: which <command>'); }, whereis: function(a){ CMD.which(a); }, type: function(a){ var c = (a||'').split(' ')[0]; print(c ? (CMD[c] ? esc(c)+' is a tigsh builtin' : 'type: '+esc(c)+': not found') : 'usage: type <command>'); }, command: function(a){ CMD.type(a.replace(/^-v\s*/, '')); }, hash: function(){ print('hits\tcommand\n   1\t/usr/bin/help'); },
      alias: function(){ print("alias ll='ls -la'\nalias hire='open contact'\nalias gs='git status'"); }, unalias: function(){ print(''); },
      env: function(){ print('USER='+USER.name+'\nHOME='+USERS[USER.name].home+'\nSHELL=/bin/tigsh\nTERM=xterm-256color\nTHEME='+PREF.theme+'\nCITY='+CITY.short); }, printenv: function(){ CMD.env(); }, export: function(a){ print(a ? '' : 'declare -x USER="'+USER.name+'"'); }, set: function(){ CMD.env(); }, unset: function(){ print(''); },
      head: function(a){ print(/resume/.test(a) ? 'Chase Johnston \u2014 Marketing Manager \u00b7 Product Marketing, GTM & Growth' : 'head: '+esc(a||'')+': try '+o('head resume.pdf')); }, tail: function(a){ print(/resume/.test(a) ? 'EDUCATION \u2014 University of Washington, BA Marketing Communications' : 'tail: '+esc(a||'')+': no such file'); },
      less: function(a){ CMD.cat(a); }, more: function(a){ CMD.cat(a); }, bat: function(a){ CMD.cat(a); }, wc: function(a){ print(/resume/.test(a) ? '       1     412    3172 resume.pdf  (one page, as promised)' : 'wc: '+esc(a||'')+': no such file'); },
      sort: function(a){ print(esc((a||'').split(/\s+/).sort().join(' '))); }, uniq: function(a){ print(esc((a||'').split(/\s+/).filter(function(x, i, arr){ return arr.indexOf(x) === i; }).join(' '))); }, rev: function(a){ print(esc((a||'').split('').reverse().join(''))); }, tac: function(a){ CMD.rev(a); }, nl: function(a){ print('     1\t'+esc(a||'')); },
      awk: function(){ print("awk: '{ print \"hire chase\" }'  \u2192  hire chase"); }, sed: function(){ print('sed: s/boring PDF/operating system/g \u2014 done, that is this site.'); }, cut: function(a){ print(esc((a||'').slice(0, 12))); }, tr: function(a){ print(esc((a||'').toUpperCase())); }, xargs: function(a){ print(esc(a||'')); }, tee: function(a){ print(esc(a||'')); },
      tar: function(){ print('tar: portfolio.tar.gz created (822K). it is just this page.'); }, zip: function(){ print('  adding: tigOS.html (deflated 87%)'); }, unzip: function(){ print('Archive: portfolio.zip\n  inflating: tigOS.html'); }, gzip: function(){ CMD.zip(); }, gunzip: function(){ CMD.unzip(); },
      cp: function(){ print('cp: read-only file system'); }, mv: function(){ print('mv: read-only file system'); }, ln: function(){ print('ln: the only link that matters is '+o('linkedin')); }, chown: function(){ print('chown: chase already owns everything here.'); }, chgrp: function(){ CMD.chown(); },
      passwd: function(){ print('passwd: changing password for '+USER.name+'\npasswd: nope. this is a portfolio.', 'err'); }, useradd: function(){ print('useradd: only chase, ariel and greggyd live here.'); }, adduser: function(){ CMD.useradd(); }, userdel: function(){ print('userdel: absolutely not.'); },
      w: function(){ print(USER.name+'\tconsole\t'+new Date().toLocaleTimeString()+'\tbrowsing the portfolio'); }, who: function(){ CMD.w(); }, finger: function(a){ print('Login: '+esc(a||USER.name)+'\nName: '+(/chase/.test(a||USER.name) ? 'Chase Johnston' : esc(a||USER.name))+'\nPlan: hire chase.'); }, last: function(){ print(USER.name+'  console  '+new Date().toDateString()+'  still logged in'); },
      id: function(){ print('uid=501('+USER.name+') gid=20(staff) groups=20(staff),80(admin),1000(marketing)'); }, groups: function(){ print('staff admin marketing'); }, hostname: function(){ print('chasetiger.com'); }, arch: function(){ print('arm64'); }, lsb_release: function(){ print('Distributor ID: tigOS\nRelease: 2.0\nCodename: clear'); },
      systemctl: function(a){ print(/status/.test(a) ? '\u25cf tigos.service - Portfolio\n   Active: active (running) since boot\n   Main PID: 1 (tigos)' : 'systemctl: '+esc(a||'')+': permission denied. chase runs the daemons.'); }, service: function(a){ CMD.systemctl(a); }, journalctl: function(){ print('-- Logs begin at boot --\ntigos[1]: booted\ntigos[1]: dock ready\ntigos[1]: you arrived. welcome.'); }, dmesg: function(){ print('[    0.000000] tigOS 2.0 booting\n[    0.420000] dock: 8 tiles\n[    1.000000] wallpaper: purple, obviously'); },
      crontab: function(){ print('# m h dom mon dow command\n0 9 * * 1-5  coffee\n0 * * * *    ship'); }, nohup: function(a){ print('appending output to nohup.out'); }, jobs: function(){ print('[1]+  Running    marketing &'); }, bg: function(){ print(''); }, fg: function(){ print('marketing'); }, tmux: function(){ print('tmux: sessions should be nested with care. this one is nested in a portfolio.'); }, screen: function(){ CMD.tmux(); },
      'ssh-keygen': function(){ print('Generating public/private ed25519 key pair.\nYour identification has been saved in ~/.ssh/hire_chase'); }, scp: function(){ print('scp: nothing to copy. download the resume instead: '+o('resume')); }, rsync: function(){ CMD.scp(); },
      nc: function(){ print('nc: connection refused. the only open port is '+o('contact')); }, netstat: function(){ print('Proto  Local Address        Foreign Address     State\ntcp    chasetiger.com:443   you:*               ESTABLISHED'); }, ss: function(){ CMD.netstat(); }, traceroute: function(a){ print('traceroute to '+esc(a||'chasetiger.com')+'\n 1  your browser  0.1 ms\n 2  this page     0.2 ms\n 3  chase         hired'); }, tracert: function(a){ CMD.traceroute(a); },
      dig: function(a){ print(';; ANSWER SECTION:\n'+esc(a||'chasetiger.com')+'.\t300\tIN\tA\t127.0.0.1'); }, nslookup: function(a){ CMD.dig(a); }, host: function(a){ CMD.dig(a); }, whois: function(a){ print('Domain Name: '+esc(a||'chasetiger.com')+'\nRegistrant: Chase Johnston\nStatus: shipping'); }, ip: function(){ print('1: lo0: <LOOPBACK> 127.0.0.1\n2: en0: <UP> you are here'); }, route: function(){ print('default via dock dev en0'); },
      docker: function(a){ print(/ps/.test(a) ? 'CONTAINER ID  IMAGE      STATUS\nc0ffee        tigos:2.0  Up since boot' : 'docker: this site runs in a single HTML file. no containers were harmed.'); }, kubectl: function(){ print('kubectl: 1 pod, 1 node, 0 problems. wildly over-engineered for a portfolio.'); }, k: function(){ CMD.kubectl(); }, terraform: function(){ print('Plan: 0 to add, 0 to change, 0 to destroy. it is a static site.'); },
      make: function(){ print('make: Nothing to be done for \'portfolio\'.'); }, gcc: function(){ print('gcc: fatal error: no input files. also this is javascript.'); }, java: function(){ print('java version "21" \u2014 but honestly, try '+o('node')); }, ruby: function(){ print('ruby 3.3 \u2014 puts "hire chase"'); }, go: function(){ print('go: fmt.Println("hire chase")'); }, rustc: function(){ print('rustc: compiled hire_chase in 0.4s. zero unsafe blocks.'); }, cargo: function(){ CMD.rustc(); }, perl: function(){ print('perl -e \'print "hire chase"\'  \u2192  hire chase'); }, php: function(){ print('PHP 8.3 \u2014 <?php echo "hire chase"; ?>'); },
      tree: function(){ print('.\n\u251c\u2500\u2500 '+VIS().join('.app\n\u251c\u2500\u2500 ')+'.app\n\u2514\u2500\u2500 resume.pdf'); },
      yes: function(a){ print(esc(a||'y')+'\n'+esc(a||'y')+'\n'+esc(a||'y')+'\n... (ok, that is enough)'); }, 'true': function(){ print(''); }, 'false': function(){ print(''); }, test: function(){ print(''); }, '[': function(){ print(''); },
      bc: function(a){ try { var e = (a||'').replace(/[^0-9+\-*\/().% ]/g, ''); print(e ? String(Function('return ('+e+')')()) : 'bc: type an expression, e.g. '+o('bc 2+2')); } catch(err){ print('bc: syntax error', 'err'); } }, expr: function(a){ CMD.bc(a); }, calc: function(a){ CMD.bc(a); },
      banner: function(a){ art(COW(a||'hire chase')); }, figlet: function(a){ CMD.banner(a); }, toilet: function(a){ CMD.banner(a); }, lolcat: function(){ print('\u{1F308} everything is already colourful here.'); }, cmatrix: function(){ CMD.matrix(); },
      telnet: function(){ print('Trying... telnet is from 1969. so is the tux logo. connection closed.'); }, ftp: function(){ print('ftp: use the Download button in '+o('resume')+'.'); }, mail: function(){ open('contact'); print('mail: opening Contact. email is fastest.'); }, mutt: function(){ CMD.mail(); },
      info: function(a){ CMD.man(a); }, tldr: function(a){ print(a ? esc(a)+': does the obvious thing, with a joke.' : 'tldr: this is a portfolio shaped like an OS. '+o('help')); }, apropos: function(a){ print('help (1) - the map\nresume (1) - the one-pager\npet (6) - a friend'); }, whatis: function(a){ CMD.tldr(a); },
      source: function(){ print(''); }, '.': function(){ print(''); }, bash: function(){ print('bash-5.2$ you are already in a shell. it is called tigsh.'); }, zsh: function(){ print('tigsh is zsh-flavoured. you are home.'); }, sh: function(){ CMD.bash(); }, fish: function(){ print('\u{1F41F} fish: welcome to fish, the friendly interactive shell. (kidding, still tigsh.)'); }, exec: function(a){ var c = (a||'').split(' ')[0]; if(CMD[c]) CMD[c](a.split(' ').slice(1).join(' ')); else print('exec: '+esc(c)+': not found'); }, time: function(a){ var t0 = performance.now(); var c = (a||'').split(' ')[0]; if(CMD[c]) CMD[c](a.split(' ').slice(1).join(' ')); print('real\t0m'+((performance.now()-t0)/1000).toFixed(3)+'s'); },
      // windows
      powershell: function(){ print('Windows PowerShell\nPS C:\\Users\\'+USER.name+'> this is a mac. sort of.'); }, pwsh: function(){ CMD.powershell(); }, cmd: function(){ print('Microsoft Windows [Version 10.0.tigos]\nC:\\Users\\'+USER.name+'> welcome to the wrong OS. try '+o('help')); },
      tasklist: function(){ print('Image Name          PID  Mem Usage\ntigos.exe             1   12,000 K\ncoffee.exe           42  \u221e K\nmarketing.exe       420    4x K'); }, taskkill: function(){ print('ERROR: The process "marketing.exe" could not be terminated. It ships.'); },
      systeminfo: function(){ print('OS Name:      tigOS 2.0\nOS Version:   2.0 Build 26\nSystem Type:  portfolio-based PC\nTotal Memory: enough'); }, copy: function(){ print('        0 file(s) copied. read-only file system.'); }, del: function(){ CMD.rm(); }, erase: function(){ CMD.rm(); }, move: function(){ CMD.mv(); }, ren: function(){ CMD.mv(); }, rename: function(){ CMD.mv(); }, md: function(){ CMD.mkdir(); }, rd: function(){ print('rd: access denied'); }, attrib: function(){ print('R    resume.pdf'); }, chkdsk: function(){ print('Windows has scanned the file system and found no problems. Chase is thorough.'); }, sfc: function(){ print('Windows Resource Protection did not find any integrity violations.'); },
      netsh: function(){ print('netsh: wlan show profiles \u2014 chasetiger.com (connected)'); }, winget: function(){ print('winget: Found Chase [Chase.Johnston] 2.0. Already installed.'); }, choco: function(){ print('Chocolatey v2.0 \u2014 hire-chase v1.0 already installed.'); }, scoop: function(){ CMD.choco(); }, explorer: function(){ open('projects'); print('opening Explorer\u2026 well, Projects.'); }, start: function(a){ CMD.open(a); }, notepad: function(){ print('notepad: untitled.txt \u2014 "hire chase"'); }, mspaint: function(){ open('projects'); print('mspaint: the creative work lives in Projects.'); }, wsl: function(){ print('Windows Subsystem for Linux is already running. it is called this terminal.'); }, regedit: function(){ print('regedit: absolutely not.', 'err'); },
      'get-process': function(){ CMD.tasklist(); }, 'get-childitem': function(a){ CMD.ls(a); }, gci: function(a){ CMD.ls(a); }, 'clear-host': function(){ CMD.clear(); }, 'write-host': function(a){ CMD.echo(a); }, 'get-help': function(){ CMD.help(); }, 'get-date': function(){ CMD.date(); }, 'get-location': function(){ CMD.pwd(); }, 'set-location': function(a){ CMD.cd(a); }
      ,
      version: function(){ CMD.tigos(); }, ver: function(){ CMD.tigos(); }, uname: function(){ print('tigOS chasetiger.com 2.0 vanilla-js arm64'); }
    };
    Object.keys(EXTRA_CMDS).forEach(function(k){ CMD[k] = function(arg){ EXTRA_CMDS[k](arg, { print:print, art:art, o:o, cmd:CMD }); }; });   /* screensaver, party, do, sl, konami (27-eggs.js) */
    /* tab completion: one match fills it in, several extend to the common prefix and a second tab lists them, like bash */
    var ARGS = { open:function(){ return VIS(); }, cat:function(){ return VIS(); }, cd:function(){ return VIS(); }, man:function(){ return Object.keys(CMD).filter(function(k){ return /^[a-z]/.test(k); }); }, su:function(){ return Object.keys(USERS); }, pet:function(){ return Object.keys(PETS).concat(['off']); }, pets:function(){ return Object.keys(PETS).concat(['off']); }, game:function(){ return GAMES.map(function(g){ return g.id; }); }, games:function(){ return GAMES.map(function(g){ return g.id; }); }, play:function(){ return GAMES.map(function(g){ return g.id; }); } };
    var lastTab = '';
    var tabComplete = function(){
      var at = inp.selectionStart == null ? inp.value.length : inp.selectionStart, head = inp.value.slice(0, at), tail = inp.value.slice(at), m = /(\S*)$/.exec(head), word = m[1], before = head.slice(0, head.length - word.length), first = !before.trim();
      var pool = first ? Object.keys(CMD).filter(function(k){ return /^[a-z]/.test(k); }).concat(VIS()) : (ARGS[before.trim().split(/\s+/)[0].toLowerCase()] || function(){ return []; })();
      pool = pool.filter(function(k, i, a){ return a.indexOf(k) === i; }).sort();
      var lw = word.toLowerCase(), cands = pool.filter(function(k){ return k.indexOf(lw) === 0; });
      if(!word || !cands.length){ lastTab = ''; return; }
      var set = function(w2, done){ inp.value = before + w2 + (done && !tail ? ' ' : '') + tail; var pos = (before + w2).length + (done && !tail ? 1 : 0); try { inp.setSelectionRange(pos, pos); } catch(err){} syncCur(); };
      if(cands.length === 1){ set(cands[0], true); lastTab = ''; return; }
      var pre = cands.reduce(function(a, b){ var i = 0; while(i < a.length && i < b.length && a[i] === b[i]) i++; return a.slice(0, i); });
      if(pre.length > word.length){ set(pre, false); lastTab = before + pre; return; }
      if(lastTab === head){ var cw = Math.max.apply(null, cands.map(function(k){ return k.length; })) + 2, cols = Math.max(1, Math.floor(72 / cw)), rows = [];
        for(var i = 0; i < cands.length; i += cols) rows.push(cands.slice(i, i + cols).map(function(k){ return k + ' '.repeat(cw - k.length); }).join('').replace(/\s+$/, ''));
        print(prompt()+' '+esc(inp.value)); print(rows.map(esc).join('\n'), 'dim'); lastTab = ''; }
      else lastTab = head;
    };
    inp.addEventListener('keydown', function(e){
      if(e.key === 'Tab' && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey){ e.preventDefault(); if(mode) return; tabComplete(); return; }
      if(e.ctrlKey && !e.metaKey && !e.altKey){   /* the readline keys people reach for out of habit; they stop here so ctrl+k does not open Spotlight (cmd+k still does) */
        var kk = e.key.toLowerCase(); if(/^[lcukae]$/.test(kk)) e.stopPropagation();
        if(kk === 'l'){ e.preventDefault(); CMD.clear(); return; }
        if(kk === 'c'){ e.preventDefault(); print((mode ? '<span class="dim">Password for '+mode.user+':</span>' : prompt())+' '+(mode ? '' : esc(inp.value))+'^C'); inp.value = ''; if(mode){ mode = null; refreshPrompt(); } hi = hist.length; draft = ''; syncCur(); return; }
        if(kk === 'u'){ e.preventDefault(); inp.value = inp.value.slice(inp.selectionStart || 0); try { inp.setSelectionRange(0, 0); } catch(err){} syncCur(); return; }
        if(kk === 'k'){ e.preventDefault(); inp.value = inp.value.slice(0, inp.selectionStart == null ? inp.value.length : inp.selectionStart); syncCur(); return; }
        if(kk === 'a' || kk === 'e'){ e.preventDefault(); var pos = kk === 'a' ? 0 : inp.value.length; try { inp.setSelectionRange(pos, pos); } catch(err){} syncCur(); return; }
      }
      if(e.key === 'ArrowUp' || e.key === 'ArrowDown'){
        if(mode || !hist.length) return; e.preventDefault();
        if(hi === hist.length) draft = inp.value;
        hi = e.key === 'ArrowUp' ? Math.max(0, hi - 1) : Math.min(hist.length, hi + 1);
        inp.value = hi === hist.length ? draft : hist[hi]; syncCur();
        var L = inp.value.length; try { inp.setSelectionRange(L, L); } catch(err){}
        return;
      }
      if(e.key !== 'Enter') return;
      var raw = inp.value; inp.value = ''; syncCur();
      if(!mode && raw.trim()){ if(hist[hist.length-1] !== raw.trim()) hist.push(raw.trim()); hi = hist.length; draft = ''; }
      if(mode && mode.kind === 'pw'){
        print('<span class="dim">Password for '+mode.user+':</span> '+'\u2022'.repeat(Math.min(raw.length, 12)));
        if(raw === USERS[mode.user].pw){ var u = mode.user; mode = null; login(u); }
        else { mode.tries++; if(mode.tries >= 3){ print('su: authentication failure (3 attempts). returning to '+USER.name+'.', 'err'); mode = null; } else print('Sorry, try again.', 'err'); }
        refreshPrompt(); return;
      }
      raw = raw.trim(); if(!raw) return;
      print(prompt()+' '+esc(raw));
      var parts = raw.split(/\s+/), c = parts[0].toLowerCase(), arg = parts.slice(1).join(' ');
      if(c === 'switch' && /^user/i.test(arg)){ c = 'su'; arg = arg.replace(/^user\s*/i, ''); if(!arg){ CMD.users(); return; } }
      if(CMD[c]) CMD[c](arg); else if(APPS[c]) CMD.open(c); else print('command not found: '+esc(c)+'  (try '+o('help')+')', 'err');
    });
    setTimeout(function(){ if(!isMobile()) inp.focus(); }, 50);
    w.el.addEventListener('click', function(){ if(!isMobile()) inp.focus(); });
  };

/* tigOS core app.js, part 14: arcade. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------------- arcade (hidden app: reached only from the terminal's `game` command) ---------------- */
  /* The arcade (games.js, zombies.js, rounds.js, about 400 KB) ships as its own file, arcade.js, fetched right after boot so the desktop
     never waits for it. GAMES fills in when it lands; anything that needs the list first goes through arcade(cb). */
  var GAMES = [], PREMIUM = [], NORMAL = [], arcadeQ = [], arcadeState = 0;   /* 0 not asked, 1 loading, 2 ready */
  function indexGames(){
    GAMES = (window.TIG_GAMES || []).map(function(g, i){ g._i = i; return g; }).sort(function(a, b){ return ((a.premium ? 1 : 0) - (b.premium ? 1 : 0)) || ((a.rank || 99) - (b.rank || 99)) || (a._i - b._i); });   /* normal games first, the premium ones at the end */
    PREMIUM = GAMES.filter(function(g){ return g.premium; }); NORMAL = GAMES.filter(function(g){ return !g.premium; });
    IDX = index();   /* Spotlight learns the games */
  }
  function arcade(cb){
    if(arcadeState === 2){ if(cb) cb(); return; }
    if(cb) arcadeQ.push(cb);
    if(arcadeState === 1) return; arcadeState = 1;
    var done = function(){ arcadeState = 2; indexGames(); var q = arcadeQ; arcadeQ = []; q.forEach(function(f){ f(); }); };
    if(window.TIG_GAMES && window.TIG_GAMES.length){ done(); return; }   /* already on the page */
    var sc = document.createElement('script'); sc.src = (window.TIG_BUILD && window.TIG_BUILD.arcade) || 'arcade.js'; sc.async = true;
    sc.onload = done; sc.onerror = function(){ arcadeState = 0; toast('The arcade did not load. Check the connection and try again.'); };
    document.head.appendChild(sc);
  }
  /* a game can lean on a vendored library (Nightshift: Three.js). It ships as a hashed asset and is fetched the first time such a game starts. */
  var LIBS = {};   /* asset key -> 0 idle, 1 loading, 2 ready */
  function loadLib(key, cb, err){ var glob = { three:'THREE' }[key] || key; if(window[glob] || LIBS[key] === 2){ LIBS[key] = 2; cb(); return; }
    var sc = document.createElement('script'); sc.src = (window.TIG_ASSETS && window.TIG_ASSETS[key]) || key+'.js'; sc.async = true; LIBS[key] = 1;
    sc.onload = function(){ LIBS[key] = 2; cb(); }; sc.onerror = function(){ LIBS[key] = 0; if(err) err(); }; document.head.appendChild(sc); }
  var GSTORE = { get: function(){ try { return JSON.parse(localStorage.getItem('tigos.games') || '{}'); } catch(e){ return {}; } }, set: function(o){ try { localStorage.setItem('tigos.games', JSON.stringify(o)); } catch(e){} } };
  function gameById(q){ q = String(q || '').toLowerCase().trim(); if(!q) return null; if(/^\d+$/.test(q) && GAMES[+q-1]) return GAMES[+q-1]; return GAMES.filter(function(g){ return g.id === q || g.name.toLowerCase() === q; })[0] || null; }
  function isTouch(){ return isMobile() || (window.matchMedia && matchMedia('(pointer:coarse)').matches); }
  /* full screen = the window swallows the whole tigOS surface (menubar, dock and pets fade), plus the browser's own fullscreen when it lets us. Esc, the red light, the ⤡ button or the green light all leave it. */
  function gameFs(w, on){
    var is = w.el.classList.contains('fs'); if(on === undefined) on = !is; if(on === is) return;
    if(on){
      if(w.max) zoom(w);   /* zoomed geometry would otherwise be what we restore to */
      w.fsPrev = w.el.style.cssText; w.el.style.setProperty('--fsTop', (root.getBoundingClientRect().top - desk.getBoundingClientRect().top)+'px');
      w.el.classList.add('fs'); root.classList.add('gaming'); focus(w);
      try { if(document.fullscreenEnabled && root.requestFullscreen && !document.fullscreenElement){ var p = root.requestFullscreen(); if(p && p.catch) p.catch(function(){}); } } catch(e){}
    } else {
      w.el.classList.remove('fs'); root.classList.remove('gaming'); var z = w.el.style.zIndex; w.el.style.cssText = w.fsPrev || ''; w.el.style.zIndex = z; w.el.style.removeProperty('--fsTop');
      try { if(document.fullscreenElement && document.exitFullscreen){ var q = document.exitFullscreen(); if(q && q.catch) q.catch(function(){}); } } catch(e){}
    }
    if(w.onFs) w.onFs(on);
  }
  document.addEventListener('fullscreenchange', function(){ if(!document.fullscreenElement){ var f = $('.win.fs'); if(f && WM.wins[f.dataset.app]) gameFs(WM.wins[f.dataset.app], false); } });
  RENDER.games = function(w){
    if(arcadeState !== 2){ w.body.innerHTML = '<div class="pad gm-loading"><div class="eyebrow">Arcade</div><p>Loading the games\u2026</p></div>'; arcade(function(){ if(w.el.isConnected) RENDER.games(w); }); return; }
    var cur = null, G = null, raf = 0, last = 0, keyH, keyU, visH, ro, stage, cv, ctx, hud = {}, state = { paused:false, over:false, ready:true, score:0, best:0 };
    var PADS = { dirs:[['\u25C0','ArrowLeft'],['\u25B2','ArrowUp'],['\u25BC','ArrowDown'],['\u25B6','ArrowRight']], lr:[['\u25C0','ArrowLeft'],['\u25CF',' '],['\u25B6','ArrowRight']], stack:[['\u25C0','ArrowLeft'],['\u25BC','ArrowDown'],['\u25B6','ArrowRight'],['\u21BB','ArrowUp'],['drop',' '],['hold','c']], ship:[['\u25C0','ArrowLeft'],['\u25B2','ArrowUp'],['\u25B6','ArrowRight'],['\u25CF',' ']], ud:[['\u25B2','ArrowUp'],['\u25BC','ArrowDown']], plat:[['\u25C0','ArrowLeft'],['\u25B2','ArrowUp'],['\u25BC','ArrowDown'],['\u25B6','ArrowRight'],['jump',' ']], arty:[['\u25C0','ArrowLeft'],['\u25B2','ArrowUp'],['\u25BC','ArrowDown'],['\u25B6','ArrowRight'],['pwr \u2212','s'],['pwr +','w'],['fire',' '],['nuke','n']], duel:[['\u25C0','ArrowLeft'],['\u25B2','ArrowUp'],['\u25B6','ArrowRight'],['fire','x'],['block','z'],['jump',' ']], fps:[['\u21B0','ArrowLeft'],['\u25B2','ArrowUp'],['\u25BC','ArrowDown'],['\u21B1','ArrowRight'],['fire',' '],['use','f'],['reload','r'],['swap','q']] };
    function bestOf(id){ return +(GSTORE.get()[id] || 0); }
    function saveBest(){ if(!G) return; var o = GSTORE.get(); if(state.score > +(o[G.id] || 0)){ o[G.id] = state.score; GSTORE.set(o); } }
    function stop(){ if(raf) cancelAnimationFrame(raf); raf = 0; if(cur && cur.stop) try { cur.stop(); } catch(e){} window.removeEventListener('blur', releaseAll); document.removeEventListener('pointerup', docUp, true); document.removeEventListener('pointercancel', docUp, true); padHeld = {}; if(ro){ try { ro.disconnect(); } catch(e){} ro = null; } if(keyH){ document.removeEventListener('keydown', keyH); document.removeEventListener('keyup', keyU); document.removeEventListener('visibilitychange', visH); keyH = null; } if(cur){ saveBest(); if(cur.destroy) try { cur.destroy(); } catch(e){} } cur = null; G = null; w.game = null; }
    function home(){
      stop(); if(w.el.classList.contains('fs')) gameFs(w, false); w.tools.innerHTML = '';
      var best = GSTORE.get();
      var card = function(g){ var i = GAMES.indexOf(g); return '<button type="button" class="gm-card'+(g.premium ? ' premium' : '')+'" data-game="'+g.id+'" style="--gc:'+g.color+'"><span class="gm-ico">'+g.icon+'</span><span class="gm-meta"><b>'+esc(g.name)+'</b><small>'+esc(g.blurb)+'</small><em>'+esc(isTouch() && g.tkeys ? g.tkeys : g.keys)+'</em></span><span class="gm-best">'+(best[g.id] ? 'best '+best[g.id] : 'unplayed')+'</span><kbd>'+(i+1)+'</kbd></button>'; };
      w.body.innerHTML = '<div class="gm-home"><div class="gm-head"><h2>Arcade</h2><p>'+GAMES.length+' games, all '+(isTouch() ? 'touch friendly with an on-screen pad' : 'keyboard friendly and a few happy with a mouse')+'. In the terminal, <code>game &lt;name&gt;</code> jumps straight in.</p></div><div class="gm-grid">'+NORMAL.map(card).join('')+'</div>'+
        (PREMIUM.length ? '<div class="gm-prem"><h3>Premium Arcade Games</h3><p>The headliners: bigger worlds, longer sessions, high scores worth defending.</p><div class="gm-grid">'+PREMIUM.map(card).join('')+'</div></div>' : '')+
        '<p class="gm-foot">'+(isTouch() ? 'Games open full screen on touch. The <kbd>Games</kbd> button up top brings you back here.' : '<kbd>P</kbd> pauses, <kbd>R</kbd> restarts, the green light or <kbd>\u2922</kbd> goes full screen, <kbd>Esc</kbd> brings the desktop back. Type a number to launch.')+'</p></div>';
      $$('.gm-card', w.body).forEach(function(b){ b.addEventListener('click', function(){ play(b.getAttribute('data-game')); }); });
      var numBuf = '', numT = 0;   /* two-digit launch: "1" waits a beat for a second digit when games 10-19 exist */
      keyH = function(e){ if(w.min || !w.el.classList.contains('focus') || e.target.closest('input,textarea,select') || e.metaKey || e.ctrlKey || e.altKey) return; if(!/^[0-9]$/.test(e.key)) return; e.preventDefault(); clearTimeout(numT);
        var n = +(numBuf + e.key); if(numBuf && GAMES[n-1]){ numBuf = ''; play(GAMES[n-1].id); return; } numBuf = '';
        if(e.key === '1' && GAMES.length >= 10){ numBuf = '1'; numT = setTimeout(function(){ numBuf = ''; if(GAMES[0]) play(GAMES[0].id); }, 380); return; }
        if(GAMES[+e.key-1]) play(GAMES[+e.key-1].id); };
      keyU = function(){}; visH = function(){}; document.addEventListener('keydown', keyH); document.addEventListener('keyup', keyU); document.addEventListener('visibilitychange', visH);
    }
    function fit(){ if(!cv || !stage || !G) return; var sw = stage.clientWidth, sh = stage.clientHeight; if(!sw || !sh) return;
      if(G.gl){ cv.style.width = sw+'px'; cv.style.height = sh+'px'; if(cur && cur.resize) try { cur.resize(sw, sh); } catch(e){} return; }   /* a WebGL game fills the stage and sizes its own renderer */
      var sc = Math.min(sw / G.W, sh / G.H); cv.style.width = Math.floor(G.W * sc)+'px'; cv.style.height = Math.floor(G.H * sc)+'px'; }
    function setOver(html){ var ov = $('.gm-over', w.body); if(!ov) return; if(html === null){ ov.hidden = true; ov.innerHTML = ''; } else { ov.innerHTML = html; ov.hidden = false; } }
    function overlay(){
      if(state.over){ var nb = state.score > 0 && state.score >= state.best; setOver('<b>'+esc(state.overMsg || 'Game over')+'</b><span>score '+state.score+(nb ? '  \u00b7  new best' : '  \u00b7  best '+state.best)+'</span><div><button type="button" data-again>Play again <kbd>R</kbd></button><button type="button" data-back>All games</button></div>'); }
      else if(state.paused) setOver('<b>Paused</b><span>press <kbd>P</kbd> or tap to keep going</span>');
      else if(state.ready && G.intro) setOver(G.intro(isTouch()));   /* a game may bring its own title card; it must still say "press any key" or "tap" */
      else if(state.ready) setOver('<b>'+esc(G.name)+'</b><span>'+esc(isTouch() && G.tkeys ? G.tkeys : G.keys)+'</span>'+(isTouch() && G.W > G.H * 1.2 && window.innerHeight > window.innerWidth ? '<small>wider than it is tall: turn your phone sideways for a bigger picture</small>' : '')+'<em>'+(isTouch() ? 'tap' : 'press any key')+' to start</em>');
      else setOver(null);
      var ov = $('.gm-over', w.body); if(ov && !ov.hidden){ var ag = $('[data-again]', ov); if(ag) ag.addEventListener('click', function(e){ e.stopPropagation(); restart(); }); var bk = $('[data-back]', ov); if(bk) bk.addEventListener('click', function(e){ e.stopPropagation(); home(); }); }
      hud.pause.textContent = state.paused ? 'Resume' : 'Pause'; hud.pause.disabled = state.over;
    }
    function pause(on){ if(state.over || state.ready) return; state.paused = on === undefined ? !state.paused : !!on; overlay(); }
    function restart(){ if(!cur) return; state.paused = false; state.over = false; state.ready = true; state.score = 0; state.best = bestOf(G.id); hud.score.textContent = '0'; hud.best.textContent = String(state.best); cur.reset(); overlay(); stage.focus({ preventScroll:true }); }
    function begin(){ if(!state.ready) return; state.ready = false; overlay(); }
    function loop(ts){ raf = requestAnimationFrame(loop); if(!cur) return; var dt = last ? Math.min(.05, (ts - last) / 1000) : 0; last = ts; try { if(!state.paused && !state.over && !state.ready) cur.update(dt); cur.draw(ctx); } catch(e){ stop(); setOver('<b>That game crashed</b><span>'+esc(String(e && e.message || e))+'</span><div><button type="button" data-back>All games</button></div>'); var bk = $('[data-back]', w.body); if(bk) bk.addEventListener('click', home); } }
    function api(){ return { W:G.W, H:G.H, best:state.best, touch:isTouch(), canvas:cv, stage:stage,
      score: function(n){ state.score = +n || 0; hud.score.textContent = String(state.score); if(state.score > state.best){ state.best = state.score; hud.best.textContent = String(state.best); } },
      over: function(msg){ if(state.over) return; state.over = true; state.overMsg = msg || 'Game over'; saveBest(); overlay(); },
      status: function(t){ hud.status.textContent = t || ''; } }; }
    /* touch pad: arrows become a d-pad cluster on the left, everything else an action cluster on the right, like a handheld */
    function padHtml(pad){ var dir = { ArrowLeft:'l', ArrowUp:'u', ArrowDown:'d', ArrowRight:'r' }, dp = pad.filter(function(p){ return dir[p[1]]; }), ac = pad.filter(function(p){ return !dir[p[1]]; }), btn = function(p, cls){ return '<button type="button" class="'+cls+'" data-key="'+esc(p[1])+'" aria-label="'+esc(p[1] === ' ' ? 'action' : p[1])+'">'+p[0]+'</button>'; };
      return '<div class="gm-pad'+(dp.length && ac.length ? ' both' : '')+'">'+(dp.length ? '<div class="gm-dpad'+(dp.length === 2 ? ' two' : '')+'">'+dp.map(function(p){ return btn(p, 'gm-'+dir[p[1]]); }).join('')+'</div>' : '')+(ac.length ? '<div class="gm-acts n'+ac.length+'">'+ac.map(function(p){ return btn(p, 'gm-act'); }).join('')+'</div>' : '')+'</div>'; }
    var padHeld = {};   /* pointerId -> pad button, so a lost pointerup (finger slid off, tab switch) never leaves a key stuck down */
    function padUp(b){ if(!b) return; b.classList.remove('on'); Object.keys(padHeld).forEach(function(id){ if(padHeld[id] === b) delete padHeld[id]; }); if(cur) try { cur.key(b.getAttribute('data-key'), false); } catch(e){} }
    function releaseAll(){ $$('.gm-pad button.on', w.body).forEach(padUp); padHeld = {}; }
    function docUp(e){ if(padHeld[e.pointerId]) padUp(padHeld[e.pointerId]); }
    function play(id){
      var g = gameById(id); if(!g){ home(); return; }
      stop(); if(w.el.classList.contains('fs')) root.classList.add('gaming');
      if(g.lib && LIBS[g.lib] !== 2 && !window[{ three:'THREE' }[g.lib] || g.lib]){ w.body.innerHTML = '<div class="pad gm-loading"><div class="eyebrow">Arcade</div><p>Loading '+esc(g.name)+'\u2026</p></div>'; loadLib(g.lib, function(){ if(w.el.isConnected && $('.gm-loading', w.body)) play(id); }, function(){ if(w.el.isConnected){ toast(g.name+' did not load. Check the connection and try again.'); home(); } }); return; }
      G = g; state = { paused:false, over:false, ready:true, score:0, best:bestOf(g.id), overMsg:'' };
      var touch = isTouch(), pad = touch && PADS[g.pad] ? PADS[g.pad] : null;
      w.body.innerHTML = '<div class="gm'+(touch ? ' touch' : '')+'"><div class="gm-hud"><button type="button" class="gm-backb" data-back>'+ic('back')+'<span>Games</span></button><b class="gm-name" style="--gc:'+g.color+'">'+esc(g.name)+'</b><span class="gm-sc">score <b data-score>0</b></span><span class="gm-sc best">best <b data-best>'+state.best+'</b></span><span class="gm-status" data-status></span><span class="gm-sp"></span><button type="button" data-pause>Pause</button><button type="button" data-restart>Restart</button><button type="button" data-fs title="Full screen (Esc leaves)">'+ic('expand')+'</button></div>'+
        '<div class="gm-stage" tabindex="0" aria-label="'+esc(g.name)+' game"><canvas class="gm-cv" width="'+g.W+'" height="'+g.H+'"></canvas><div class="gm-over" hidden></div></div>'+
        (pad ? padHtml(pad) : '')+'</div>';
      stage = $('.gm-stage', w.body); cv = $('.gm-cv', w.body); hud = { score:$('[data-score]', w.body), best:$('[data-best]', w.body), status:$('[data-status]', w.body), pause:$('[data-pause]', w.body), fs:$('[data-fs]', w.body) };
      if(g.gl){ ctx = null; cv.classList.add('fill'); } else { var dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = g.W * dpr; cv.height = g.H * dpr; ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
      cur = g.make(api()); w.game = cur; stage.tigGame = cur; cur.reset(); overlay();
      $('[data-back]', w.body).addEventListener('click', home); hud.pause.addEventListener('click', function(){ pause(); stage.focus({ preventScroll:true }); }); $('[data-restart]', w.body).addEventListener('click', restart); hud.fs.addEventListener('click', function(){ gameFs(w); stage.focus({ preventScroll:true }); });
      w.onFs = function(on){ hud.fs.innerHTML = ic(on ? 'compress' : 'expand'); hud.fs.title = on ? 'Leave full screen (Esc)' : 'Full screen (Esc leaves)'; setTimeout(fit, 60); setTimeout(fit, 520); };
      var pt = function(e){ var r = cv.getBoundingClientRect(); return { x:(e.clientX - r.left) / r.width * g.W, y:(e.clientY - r.top) / r.height * g.H }; }, sw = null;
      stage.addEventListener('contextmenu', function(e){ e.preventDefault(); });
      stage.addEventListener('pointerdown', function(e){ if(e.target.closest('.gm-over button, .gm-over input, .gm-over select, .gm-over label, .gm-over output')) return;   /* a title card may carry settings controls */ stage.focus({ preventScroll:true }); if(state.over) return; if(state.paused){ pause(false); return; } if(state.ready){ begin(); if(cur && cur.wake) try { cur.wake(); } catch(x){} return; }   /* the click that dismisses "press any key" only starts the game: it never reaches the frog */ var p = pt(e); sw = { x:e.clientX, y:e.clientY, t:Date.now() }; if(cur) cur.pointer('down', p.x, p.y, e); });
      stage.addEventListener('pointermove', function(e){ if(!cur || state.over) return; var p = pt(e); cur.pointer('move', p.x, p.y, e); });
      stage.addEventListener('pointerup', function(e){ if(!cur) return; var p = pt(e); cur.pointer('up', p.x, p.y, e);
        if(sw && (g.pad === 'dirs' || g.pad === 'stack')){ var dx = e.clientX - sw.x, dy = e.clientY - sw.y, k = null; if(Math.hypot(dx, dy) > 24) k = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : (dy > 0 ? 'ArrowDown' : 'ArrowUp'); else if(g.pad === 'stack' && e.pointerType === 'touch') k = 'ArrowUp'; if(k){ cur.key(k, true); cur.key(k, false); } } sw = null; });
      $$('.gm-pad button', w.body).forEach(function(b){ var k = b.getAttribute('data-key'), dn = function(e){ e.preventDefault(); if(b.setPointerCapture) try { b.setPointerCapture(e.pointerId); } catch(x){} padHeld[e.pointerId] = b; if(state.paused) pause(false); begin(); if(cur && !state.over) cur.key(k, true); b.classList.add('on'); }, up = function(e){ if(e && e.preventDefault) e.preventDefault(); padUp(b); }; b.addEventListener('pointerdown', dn); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up); b.addEventListener('pointerleave', function(e){ if(e.pointerType === 'mouse') up(e); }); b.addEventListener('contextmenu', function(e){ e.preventDefault(); }); });
      var padEl = $('.gm-pad', w.body); if(padEl){ padEl.addEventListener('touchstart', function(e){ e.preventDefault(); }, { passive:false }); padEl.addEventListener('touchmove', function(e){ e.preventDefault(); }, { passive:false }); }
      window.addEventListener('blur', releaseAll); document.addEventListener('pointerup', docUp, true); document.addEventListener('pointercancel', docUp, true);
      keyH = function(e){
        if(!cur || w.min || !w.el.classList.contains('focus') || e.metaKey || e.ctrlKey || e.altKey) return;
        if(e.target.closest('input,textarea,select')){   /* a title-card setting has focus: arrows, Tab, Space and Enter still drive the control, any other key hands off to the game */
          if(!(state.ready && e.target.closest('.gm-over') && !/^(Arrow|Tab|Home|End|Page|Enter| $)/.test(e.key))) return;
          e.target.blur(); stage.focus({ preventScroll:true });
        }
        if(e.key === 'p' || e.key === 'P'){ e.preventDefault(); pause(); return; }
        if((e.key === 'r' || e.key === 'R') && !(G.ownKeys && !state.over)){ e.preventDefault(); restart(); return; }   /* the shooter owns R for reload; its restart is the HUD button or the game-over card */
        if(state.over){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); restart(); } return; }
        if(e.key === 'Escape') return;
        if(state.paused){ if(e.key !== 'Tab') e.preventDefault(); return; }
        if(e.repeat){ if(/^Arrow| $/.test(e.key)) e.preventDefault(); return; }
        begin(); var h = cur.key(e.key, true); if(h || /^Arrow|^ $/.test(e.key)) e.preventDefault();
      };
      keyU = function(e){ if(cur) cur.key(e.key, false); };
      visH = function(){ if(document.hidden){ releaseAll(); if(cur && !state.over && !state.ready) pause(true); } };
      document.addEventListener('keydown', keyH); document.addEventListener('keyup', keyU); document.addEventListener('visibilitychange', visH);
      if(window.ResizeObserver){ ro = new ResizeObserver(fit); ro.observe(stage); } fit(); setTimeout(fit, 50);
      last = 0; raf = requestAnimationFrame(loop);
      if(!w.el.classList.contains('fs')) gameFs(w, true);   /* a game takes the whole screen like an app; the Games button or Esc comes back */
      if(document.activeElement && document.activeElement !== document.body && document.activeElement.blur) document.activeElement.blur();
      setTimeout(function(){ if(stage && stage.isConnected) stage.focus({ preventScroll:true }); }, 30);
    }
    w.route = function(id){ if(gameById(id)) play(id); else home(); };
    w.destroy = function(){ stop(); if(w.el.classList.contains('fs')) gameFs(w, false); root.classList.remove('gaming'); };
    home();
  };

/* tigOS core app.js, part 15: pets window. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------------- pets window (hidden app: `pets` in the terminal, or search "pet") ---------------- */
  RENDER.pets = function(w){
    var seg = function(key, opts){ return '<div class="seg" data-pref="'+key+'">'+opts.map(function(o){ return '<button type="button" data-v="'+o[0]+'" class="'+(PREF[key] === o[0] ? 'on' : '')+'">'+o[1]+'</button>'; }).join('')+'</div>'; };
    var curKey = PREF.pet && PETS[PREF.pet] ? PREF.pet : '';
    /* each card holds a real .pet (same markup as the desktop one, minus drag/name), so it blinks, bobs, wags and hovers in its box */
    var mini = function(k){ return '<div class="pet" data-pet="'+k+'" aria-hidden="true"><span class="shadow"></span><span class="body"><span class="art">'+PETS[k].svg+'</span></span><span class="hearts"><i>\u2665</i><i>\u2665</i><i>\u2665</i></span></div>'; };
    w.body.innerHTML = '<div class="pt-home"><div class="pt-head"><div><h2>Pets</h2><p>'+Object.keys(PETS).length+' desktop companions, one out at a time. Drag them anywhere on the desktop; they stay close to where you put them. Drop one on the X to say goodbye.</p></div>'+
      '<div class="pt-size"><span>Size</span>'+seg('petsize', [['sm','S'],['md','M'],['lg','L']])+'</div></div><div class="pt-grid">'+
      Object.keys(PETS).map(function(k){ var pt = PETS[k], on = k === curKey; return '<div class="pt-card'+(on ? ' on' : '')+'" data-pet="'+k+'"><div class="pt-art">'+mini(k)+'</div><div class="pt-meta"><b>'+esc(pt.name)+'</b><small>the '+esc(pt.label)+'</small><em>'+(pt.say || []).slice(0, 3).map(esc).join(' \u00b7 ')+'</em></div>'+
        (on ? '<button type="button" class="pt-btn live" data-act="off" title="Click to send '+esc(pt.name)+' home"><span class="a">Out now</span><span class="b">Send home</span></button>' : '<button type="button" class="pt-btn" data-act="on">Bring out</button>')+'</div>'; }).join('')+
      '</div></div>';
    $$('.pt-btn', w.body).forEach(function(b){ b.addEventListener('click', function(){ var k = b.closest('.pt-card').getAttribute('data-pet'); if(b.getAttribute('data-act') === 'off'){ var el = petEl(); if(el) petGoodbye(el); else petSet(''); } else { petSet(k); toast(PETS[k].name+' is out', 'Bottom right. Drag them wherever you like.'); } }); });
    $$('.seg button', w.body).forEach(function(b){ b.addEventListener('click', function(){ setPref(b.parentNode.getAttribute('data-pref'), b.getAttribute('data-v')); }); });
    /* idle moods: every few seconds one card looks around, hops or gets hearts, so the window never sits still */
    clearInterval(w.petTimer); var cards = $$('.pt-card .pet', w.body);
    w.petTimer = setInterval(function(){ if(!w.body.isConnected || w.min || document.hidden || root.classList.contains('rm')) return; var el = cards[(Math.random()*cards.length)|0], mood = ['look','hop','happy','look'][(Math.random()*4)|0]; if(!el || /look|hop|happy/.test(el.className)) return; el.classList.add(mood); setTimeout(function(){ el.classList.remove(mood); }, mood === 'look' ? 1800 : 1300); }, 2600);
    w.destroy = function(){ clearInterval(w.petTimer); };
  };

/* tigOS core app.js, part 16: settings. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------------- settings (persisted) ---------------- */
  var PREF = { theme:'dark', accent:'orange', text:'md', dock:'md', dockpos:'bottom', dockhide:'off', motion:'on', cursor:'block', pet:'', petsize:'md', wall:'live', saver:'drift', idle:'10' };
  var STORE = {
    get: function(){ var raw = null; try { raw = localStorage.getItem('tigos.prefs'); } catch(e){} if(!raw){ try { var m = document.cookie.match(/(?:^|; )tigos\.prefs=([^;]*)/); if(m) raw = decodeURIComponent(m[1]); } catch(e){} } return raw; },
    set: function(raw){ try { localStorage.setItem('tigos.prefs', raw); } catch(e){} try { document.cookie = 'tigos.prefs='+encodeURIComponent(raw)+'; max-age=31536000; path=/; SameSite=None; Secure'; document.cookie = 'tigos.prefs='+encodeURIComponent(raw)+'; max-age=31536000; path=/; SameSite=Lax'; } catch(e){} }
  };
  try { var sp = JSON.parse(STORE.get() || '{}'); Object.keys(sp).forEach(function(k){ if(k in PREF) PREF[k] = sp[k]; }); } catch(e){}
  var ACCENTS = { orange:'#ff8a00', pink:'#ff4d8d', violet:'#a78bfa', teal:'#63e6be', blue:'#8cc7ff', amber:'#ffd166' };
  function applyPrefs(){
    root.classList.toggle('light', PREF.theme === 'light');
    root.style.setProperty('--accent', ACCENTS[PREF.accent] || ACCENTS.orange); root.style.setProperty('--orange', ACCENTS[PREF.accent] || ACCENTS.orange);
    root.style.setProperty('--tscale', { sm:1, md:1.06, lg:1.18, xl:1.32 }[PREF.text] || 1.06);
    root.classList.remove('dock-sm', 'dock-lg'); if(PREF.dock !== 'md') root.classList.add('dock-'+PREF.dock);
    root.classList.remove('dock-left', 'dock-right'); if(PREF.dockpos !== 'bottom') root.classList.add('dock-'+PREF.dockpos);
    root.classList.toggle('dock-hide', PREF.dockhide === 'on');
    root.classList.toggle('rm', PREF.motion === 'off');
    if(typeof WALL !== 'undefined') wallApply();
    root.classList.remove('cur-block', 'cur-line', 'cur-underline'); root.classList.add('cur-'+(PREF.cursor || 'block'));
    root.classList.remove('pet-sm', 'pet-lg'); if(PREF.petsize && PREF.petsize !== 'md') root.classList.add('pet-'+PREF.petsize);
    if(typeof petApply === 'function') petApply();
    if(PREF.dockhide !== 'on') root.classList.remove('dock-peek');
    if(WM && WM.wins) reclamp();   /* moving or hiding the dock changes the work area, so zoomed and tall windows follow it */
    STORE.set(JSON.stringify(PREF));
    if(typeof reclamp === 'function'){ reclamp(); setTimeout(reclamp, 350); }   // dock size / position / hide all move the dock edge
  }
  /* auto-hide dock: reveal from the pointer position, not :hover (the hidden dock's hover strip and its shown position never overlap, so :hover flickered) */
  root.addEventListener('pointermove', function(e){
    if(PREF.dockhide !== 'on' || e.pointerType === 'touch' || isMobile()) return;
    var rr = root.getBoundingClientRect(), x = e.clientX, y = e.clientY, Z = 22, on = root.classList.contains('dock-peek');
    var edge = PREF.dockpos === 'left' ? x <= rr.left + Z : PREF.dockpos === 'right' ? x >= rr.right - Z : y >= rr.bottom - Z;
    if(!on){ if(edge) root.classList.add('dock-peek'); return; }
    var d = $('#dock').getBoundingClientRect(), M = 28, near = x >= d.left - M && x <= d.right + M && y >= d.top - M && y <= d.bottom + M;
    if(!edge && !near) root.classList.remove('dock-peek');
  });
  root.addEventListener('pointerleave', function(){ root.classList.remove('dock-peek'); });
  function setPref(k, v){ PREF[k] = v; applyPrefs(); petUIs(); }   /* Settings and the Pets window always agree */
  applyPrefs();
  RENDER.settings = function(w){
    var seg = function(key, opts){ return '<div class="seg" data-pref="'+key+'">'+opts.map(function(o){ return '<button type="button" data-v="'+o[0]+'" class="'+(PREF[key] === o[0] ? 'on' : '')+'">'+o[1]+'</button>'; }).join('')+'</div>'; };
    var sw = '<div class="seg" data-pref="accent">'+Object.keys(ACCENTS).map(function(k){ return '<button type="button" class="sw '+(PREF.accent === k ? 'on' : '')+'" data-v="'+k+'" style="background:'+ACCENTS[k]+'" aria-label="'+k+'"></button>'; }).join('')+'</div>';
    var row = function(t, sub, ctl){ return '<div class="set-row"><div class="lbl"><b>'+t+'</b><span>'+sub+'</span></div><div>'+ctl+'</div></div>'; };
    w.body.innerHTML = '<div class="pad"><div class="eyebrow">Settings</div><div class="h3" style="margin-bottom:6px">Make it yours</div><p class="sub" style="margin-bottom:8px">Saved on this device. Nothing leaves the browser.</p>'+
      row('Appearance', 'Dark is the default.', seg('theme', [['dark','Dark'],['light','Light']]))+
      row('Accent', 'Highlights, headline, menus.', sw)+
      row('Text size', 'Inside app windows.', seg('text', [['sm','S'],['md','M'],['lg','L'],['xl','XL']]))+
      (isMobile() ? '' :
      row('Dock size', '', seg('dock', [['sm','Small'],['md','Medium'],['lg','Large']]))+
      row('Dock position', 'Bottom, left or right.', seg('dockpos', [['bottom','Bottom'],['left','Left'],['right','Right']]))+
      row('Auto-hide dock', 'Slides away until you reach for it.', seg('dockhide', [['off','Off'],['on','On']])))+
      (isMobile() ? '' : row('Terminal cursor', 'Block is the default.', seg('cursor', [['block','Block'],['line','Line'],['underline','Underline']])))+
      (PREF.pet && PETS[PREF.pet] ? row('Pet', esc(PETS[PREF.pet].name)+' the '+esc(PETS[PREF.pet].label)+'. Drag onto the X to say goodbye, or turn off here.', '<div class="pet-ctl">'+seg('petsize', [['sm','Small'],['md','Medium'],['lg','Large']])+'<button type="button" class="pet-off" data-pet-off>Off</button></div>') : '')+
      row('Wallpaper', 'Live adds depth that follows the mouse.', seg('wall', [['live','Live'],['still','Still']]))+
      row('Screensaver', esc(PREF.saver === 'random' ? 'A different one each time.' : (SAVERS[PREF.saver] || SAVERS.drift).sub+'.'), seg('saver', Object.keys(SAVERS).map(function(k){ return [k, SAVERS[k].name]; }).concat([['random','Random']])))+
      row('Start after', 'Idle time before the screensaver.', seg('idle', [['off','Off'],['2','2 min'],['5','5 min'],['10','10 min'],['20','20 min']]))+
      row('Motion', 'Turn off animations.', seg('motion', [['on','On'],['off','Reduced']]))+
      '<div class="set-foot"><span>tigOS 2.0 \u00b7 '+VIS().length+' apps</span><button type="button" data-reset>Reset to defaults</button></div></div>';
    $$('.seg button', w.body).forEach(function(b){ b.addEventListener('click', function(){ setPref(b.parentNode.getAttribute('data-pref'), b.getAttribute('data-v')); }); });
    var po = $('[data-pet-off]', w.body); if(po) po.addEventListener('click', function(){ var el = petEl(); if(el) petGoodbye(el); else petSet(''); });
    $('[data-reset]', w.body).addEventListener('click', function(){ PREF = { theme:'dark', accent:'orange', text:'md', dock:'md', dockpos:'bottom', dockhide:'off', motion:'on', cursor:'block', pet:'', petsize:'md', wall:'live', saver:'drift', idle:'10' }; applyPrefs(); RENDER.settings(w); toast('Settings reset', 'Back to the defaults.'); });
  };

/* tigOS core app.js, part 17: lightbox. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------------- lightbox ---------------- */
  var lb = $('#lightbox');
  function lightbox(key, cap){ if(!A[key]) return; $('#lbImg').src = A[key]; $('#lbImg').alt = cap || ''; $('#lbCap').textContent = cap || ''; lb.hidden = false; }
  lb.addEventListener('click', function(){ lb.hidden = true; });

/* tigOS core app.js, part 18: spotlight. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------------- spotlight ---------------- */
  var spot = $('#spotlight'), spotIn = $('#spotInput'), spotRes = $('#spotResults'), spotSel = 0;
  function index(){
    var items = [];
    VIS().forEach(function(k){ items.push({ t:APPS[k].title, s:'Open app', k:'App', tile:APPS[k].tile, icon:APPS[k].icon, go:function(){ open(k); } }); });
    /* hidden apps never sit in the default list, but a search for them (or for what is inside them) finds them */
    items.push({ t:APPS.games.title, s:'Open app \u00b7 '+GAMES.length+' games', k:'App', hidden:true, tile:'games', icon:'gamepad', hay:'arcade game games play '+GAMES.map(function(g){ return g.id+' '+g.name; }).join(' '), go:function(){ open('games'); } });
    items.push({ t:APPS.pets.title, s:'Open app \u00b7 desktop companions', k:'App', hidden:true, tile:'paw', icon:'paw', hay:'pet pets companion '+Object.keys(PETS).map(function(k){ return k+' '+PETS[k].name+' '+PETS[k].label; }).join(' '), go:function(){ open('pets'); } });
    GAMES.forEach(function(g){ items.push({ t:g.name, s:'Arcade game \u00b7 '+g.blurb, k:'Game', tile:'games', icon:'gamepad', art:g.icon, bg:g.color, hay:g.id+' game play arcade', go:function(){ open('games', { route:g.id }); } }); });
    Object.keys(PETS).forEach(function(k){ items.push({ t:PETS[k].name+' the '+PETS[k].label, s:'Pet \u00b7 bring them out', k:'Pet', tile:'paw face', icon:'paw', art:PETS[k].svg, hay:k+' pet pets', go:function(){ petSet(k); open('pets'); } }); });
    items.splice(items.findIndex(function(x){ return x.t === APPS.contact.title; }) + 1, 0, { t:'LinkedIn', s:'Open profile \u2197 \u00b7 '+TIG.contact.linkedinLabel, k:'App', tile:'linkedin', icon:'linkedin', hay:'linkedin social profile network connect message chase', go:function(){ window.open(TIG.contact.linkedin, '_blank', 'noopener'); toast('Opening LinkedIn', TIG.contact.linkedinLabel, 'linkedin'); } });
    TIG.projects.forEach(function(p){ items.push({ t:p.name, s:p.company+' · '+p.tag, k:'Project', tile:'projects', icon:'projects', hay:p.overview+' '+p.execution+' '+p.results, go:function(){ open('projects', { route:p.id }); } }); });
    TIG.experience.forEach(function(j){ items.push({ t:j.role, s:j.company+' · '+j.dates, k:'Role', tile:'experience', icon:'exp', hay:j.bullets.join(' '), go:function(){ open('experience'); } }); });
    TIG.skills.groups.forEach(function(g){ g.items.forEach(function(s){ items.push({ t:s, s:g.name, k:'Skill', tile:'skills', icon:'skills', go:function(){ open('skills'); } }); }); });
    items.push({ t:TIG.education.school, s:TIG.education.degree+' · '+TIG.education.year, k:'Education', tile:'experience', icon:'exp', go:function(){ open('experience'); } });
    TIG.stats.forEach(function(st){ items.push({ t:st.big+' '+st.label, s:st.sub, k:'Stat', tile:'about', icon:'about', go:function(){ open('about'); } }); });
    items.push({ t:'Email Chase', s:TIG.contact.email, k:'Contact', tile:'contact', icon:'contact', go:function(){ open('contact'); } });
    items.push({ t:'Download resume', s:'One page PDF', k:'Action', tile:'resume', icon:'resume', go:function(){ open('resume'); } });

    return items;
  }
  var IDX = index(), spotHits = [];
  function spotRender(q){
    q = (q||'').trim().toLowerCase();
    /* rank: exact title, title prefix, title, subtitle, then the hidden search text, so typing a game or pet's name puts it first, ahead of the app that merely lists it */
    var rank = function(it){ var t = it.t.toLowerCase(), sub = (it.s||'').toLowerCase(), hay = (it.hay||'').toLowerCase(); return t === q ? 0 : t.indexOf(q) === 0 ? 1 : t.indexOf(q) > -1 ? 2 : sub.indexOf(q) > -1 ? 3 : hay.indexOf(q) > -1 ? 4 : 5; };
    spotHits = IDX.filter(function(it){ if(!q) return it.k === 'App' && !it.hidden; return (it.t+' '+it.s+' '+(it.hay||'')).toLowerCase().indexOf(q) > -1; }).map(function(it, i){ return { it:it, i:i, r:rank(it) }; }).sort(function(a, b){ return a.r - b.r || a.i - b.i; }).map(function(x){ return x.it; }).slice(0, 9);
    spotSel = 0;
    spotRes.innerHTML = spotHits.length ? spotHits.map(function(it, i){ return '<button type="button" data-i="'+i+'" class="'+(i===0?'sel':'')+'"><span class="sm tile '+it.tile+'"'+(it.bg ? ' style="background:linear-gradient(145deg,'+it.bg+', rgba(0,0,0,.35) 140%)"' : '')+'>'+(it.art || ic(it.icon))+'</span><span><b>'+esc(it.t)+'</b><span>'+esc(it.s)+'</span></span><em>'+it.k+'</em></button>'; }).join('') : '<div class="spot-empty">No matches for \u201c'+esc(q)+'\u201d</div>';
    $$('button', spotRes).forEach(function(b){ b.addEventListener('click', function(){ spotGo(+b.getAttribute('data-i')); }); });
  }
  function spotGo(i){ var it = spotHits[i]; spotClose(); if(it) it.go(); }
  function spotOpen(){ spot.hidden = false; spotIn.value = ''; spotRender(''); setTimeout(function(){ spotIn.focus(); }, 30); }
  function spotClose(){ spot.hidden = true; }
  spotIn.addEventListener('input', function(){ spotRender(spotIn.value); });
  spotIn.addEventListener('keydown', function(e){
    if(e.key === 'ArrowDown'){ spotSel = Math.min(spotHits.length-1, spotSel+1); e.preventDefault(); }
    else if(e.key === 'ArrowUp'){ spotSel = Math.max(0, spotSel-1); e.preventDefault(); }
    else if(e.key === 'Enter'){ spotGo(spotSel); return; }
    else if(e.key === 'Escape'){ spotClose(); return; }
    $$('button', spotRes).forEach(function(b, i){ b.classList.toggle('sel', i === spotSel); });
  });
  spot.addEventListener('click', function(e){ if(e.target === spot) spotClose(); });
  $('#mbSearch').addEventListener('click', spotOpen);

/* tigOS core app.js, part 19: logo menu. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------------- logo menu ---------------- */
  var menu = $('#tgMenu'), mbLogo = $('#mbLogo');
  mbLogo.addEventListener('click', function(e){ e.stopPropagation(); var show = menu.hidden; if(show) closePops('menu'); menu.hidden = !show; mbLogo.classList.toggle('on', show); });
  document.addEventListener('click', function(e){ if(!menu.hidden && !e.target.closest('#tgMenu')){ menu.hidden = true; mbLogo.classList.remove('on'); } });
  $$('[data-action]', menu).forEach(function(b){ b.addEventListener('click', function(){
    var act = b.getAttribute('data-action'); menu.hidden = true; mbLogo.classList.remove('on');
    if(act === 'tour'){ tourStart(); }
  }); });

/* tigOS core app.js, part 20: power. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------------- power ---------------- */
  var pw = $('#pwMenu'), pwBtn = $('#mbPower'), sleepEl = $('#sleep'), offEl = $('#off');
  pwBtn.addEventListener('click', function(e){ e.stopPropagation(); var show = pw.hidden; if(show) closePops('pw'); pw.hidden = !show; });
  document.addEventListener('click', function(e){ if(!pw.hidden && !e.target.closest('#pwMenu')) pw.hidden = true; });
  var sdEl = $('#shutdown'), sdT = [];
  function shutdownScreen(msgs, then){
    sdT.forEach(clearTimeout); sdT = [];
    sdEl.classList.remove('crt'); sdEl.hidden = false; var m = $('#sdMsg'); m.textContent = msgs[0];
    msgs.forEach(function(t, i){ if(i) sdT.push(setTimeout(function(){ m.textContent = t; }, 520*i)); });
    sdT.push(setTimeout(function(){ sdEl.classList.add('crt'); }, 520*msgs.length + 200));
    sdT.push(setTimeout(function(){ then(); }, 520*msgs.length + 700));
    sdT.push(setTimeout(function(){ sdEl.hidden = true; sdEl.classList.remove('crt'); }, 520*msgs.length + 1000));
  }
  function restart(){
    if(root.classList.contains('poweroff') || !sdEl.hidden) return;
    closePops(); pw.hidden = true; menu.hidden = true; mbLogo.classList.remove('on');
    root.classList.add('poweroff');
    setTimeout(function(){ shutdownScreen(['Restarting', 'Closing apps', 'Saving your settings'], function(){ Object.keys(WM.wins).forEach(function(k){ close(WM.wins[k]); }); root.classList.add('booting'); root.classList.remove('poweroff'); bootSeq(true); }); }, 900);
  }
  var offT;
  function powerOff(){
    if(root.classList.contains('poweroff') || !offEl.hidden) return;
    closePops(); pw.hidden = true; menu.hidden = true; mbLogo.classList.remove('on');
    root.classList.add('poweroff');   /* menubar slides up, dock drops, windows dim and sink, wallpaper fades to black */
    clearTimeout(offT); offT = setTimeout(function(){ shutdownScreen(['Shutting down', 'Closing apps', 'Saving your settings', 'Goodbye'], function(){ offEl.hidden = false; offEl.classList.remove('leaving'); offRestart(); Object.keys(WM.wins).forEach(function(k){ close(WM.wins[k]); }); setTimeout(function(){ root.classList.remove('poweroff'); }, 350); }); }, 900);
  }
  /* Safari can leave a masked pseudo-element's animation stuck after the off screen has been display:none once; restart every animation on the button each time it is shown */
  function offRestart(){
    var btn = $('.off-btn', offEl); if(!btn) return;
    try { btn.getAnimations({ subtree:true }).forEach(function(an){ an.cancel(); an.play(); }); } catch(e){}
  }
  function powerOn(){ root.classList.add('booting'); offEl.classList.add('leaving'); setTimeout(function(){ offEl.hidden = true; offEl.classList.remove('leaving'); }, 480); bootSeq(true); }
  /* screensaver: "Drift" — a field of luminous strands that sway together like kelp, inspired by macOS Drift. Full screen, clock bottom-left. */
  var SAVER = { on:false, raf:0 };
  function driftStart(){   /* started through saverStart(kind) in 26-screensavers.js */
    var cv = $('#saver'); if(!cv || SAVER.on) return; SAVER.on = true; cv.setAttribute('data-run', '1');
    var ctx = cv.getContext('2d'), W, H, strands = [], hue0 = 270 + Math.random()*60, mob = isMobile();
    var size = function(){
      W = cv.width = root.clientWidth; H = cv.height = root.clientHeight; strands = [];
      var cols = mob ? 16 : 34, rows = mob ? 26 : 20, gx = W/cols, gy = H/rows;
      for(var i = 0; i <= cols; i++) for(var j = 0; j <= rows; j++) strands.push({ x:i*gx + (Math.random()-.5)*gx*.6, y:j*gy + (Math.random()-.5)*gy*.6, len:(mob ? 30 : 44) + Math.random()*50, ph:Math.random()*6.28, w:1.2 + Math.random()*2, h:(Math.random()-.5)*50 });
    };
    size(); window.addEventListener('resize', size);
    var last = 0, t0 = performance.now();
    var frame = function(ts){
      if(!SAVER.on){ window.removeEventListener('resize', size); return; }
      SAVER.raf = requestAnimationFrame(frame);
      if(ts - last < (mob ? 40 : 24)) return; last = ts;
      var t = (ts - t0)*.001;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      var g = ctx.createRadialGradient(W*.5, H*.55, 0, W*.5, H*.55, Math.max(W, H)*.7); g.addColorStop(0, 'hsla('+(hue0+20)+',60%,10%,1)'); g.addColorStop(1, '#000'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.lineCap = 'round'; ctx.globalCompositeOperation = 'lighter';
      var hue = hue0 + Math.sin(t*.05)*30;
      for(var k = 0; k < strands.length; k++){
        var s = strands[k];
        var nx = s.x/W*2.2, ny = s.y/H*2.2;
        var ang = Math.sin(nx*1.7 + t*.35 + s.ph*.2)*1.1 + Math.cos(ny*1.4 - t*.27)*1.1 + Math.sin((nx+ny)*.9 + t*.18)*.6 - 1.2;
        var bend = Math.sin(t*.9 + s.ph)*.35;
        var dx = Math.cos(ang), dy = Math.sin(ang), L = s.len*(1 + .18*Math.sin(t*.7 + s.ph));
        var mx = s.x + dx*L*.5 + -dy*L*bend, my = s.y + dy*L*.5 + dx*L*bend, ex = s.x + dx*L, ey = s.y + dy*L;
        var a = .22 + .3*(.5 + .5*Math.sin(t*.6 + s.ph*1.3));
        ctx.strokeStyle = 'hsla('+(hue + s.h)+',85%,68%,'+a+')'; ctx.lineWidth = s.w;
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.quadraticCurveTo(mx, my, ex, ey); ctx.stroke();
        if(!mob){ ctx.strokeStyle = 'hsla('+(hue + s.h)+',90%,80%,'+(a*.35)+')'; ctx.lineWidth = s.w*3.2; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.quadraticCurveTo(mx, my, ex, ey); ctx.stroke(); }
      }
      ctx.globalCompositeOperation = 'source-over';
    };
    SAVER.raf = requestAnimationFrame(frame);
  }
  function saverStop(){ SAVER.on = false; cancelAnimationFrame(SAVER.raf); var cv = $('#saver'); if(cv){ cv.removeAttribute('data-run'); cv.removeAttribute('data-kind'); } }
  function wake(){ if(!sleepEl.hidden){ sleepEl.hidden = true; saverStop(); var g = greeting(); toast(g.t, g.s, g.i); } }
  $$('[data-power]', pw).forEach(function(b){ b.addEventListener('click', function(){
    var act = b.getAttribute('data-power'); pw.hidden = true;
    if(act === 'restart') restart();
    if(act === 'logout') loginScreen();
    if(act === 'sleep'){ sleepEl.hidden = false; tick(); saverStart(); }
    if(act === 'off') powerOff();
  }); });
  sleepEl.addEventListener('click', wake);
  $('.off-btn', offEl).addEventListener('click', function(e){ e.stopPropagation(); powerOn(); });

/* tigOS core app.js, part 21: global open handler. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------------- global open handler ---------------- */
  root.addEventListener('click', function(e){
    var t = e.target.closest('[data-open]'); if(!t) return;
    if(t.closest('#tgMenu')){ menu.hidden = true; mbLogo.classList.remove('on'); }
    var id = t.getAttribute('data-open'), cur = WM.wins[id], top = topWin();
    if(t.classList.contains('dk') && cur && !cur.min && top === cur){ minimize(cur); return; }   /* dock click on the front app tucks it away */
    open(id, { from:t });
  });

/* tigOS core app.js, part 22: keyboard. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------------- keyboard ---------------- */
  document.addEventListener('keydown', function(e){
    if(!sleepEl.hidden){ wake(); return; }
    if(!offEl.hidden) return;
    if(!loginEl.hidden && !e.target.closest('#loginIn')) return;
    var meta = e.metaKey || e.ctrlKey;
    if(meta && (e.key === 'k' || e.key === 'K')){ e.preventDefault(); spot.hidden ? spotOpen() : spotClose(); return; }
    if(e.key === 'Escape'){
      var fsw = $('.win.fs'); if(fsw && WM.wins[fsw.dataset.app]){ gameFs(WM.wins[fsw.dataset.app], false); return; }
      if(!lb.hidden){ lb.hidden = true; return; }
      if(!spot.hidden){ spotClose(); return; }
      if(!menu.hidden){ menu.hidden = true; mbLogo.classList.remove('on'); return; }
      if(!calPop.hidden){ calToggle(false); return; }
      if(tourEl){ tourEnd(); return; }
      var eg = $('.egg:not([hidden])'); if(eg){ eg.hidden = true; return; }
    }
    if(meta && (e.key === 'w' || e.key === 'W')){ var t = topWin(); if(t){ e.preventDefault(); close(t); } }
    if(!meta && !e.altKey && spot.hidden && !e.target.closest('input,textarea') && !$('.win.focus[data-app="games"]') && /^[1-8]$/.test(e.key)){ open(DOCK_ORDER[+e.key-1]); }
  });

/* tigOS core app.js, part 23: tour. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------------- tour ---------------- */
  var TOUR = [
    { sel:'#dock', t:'The Dock', s:'Every app lives here. Click to open, click again to bring it forward. Press 1\u20137 as shortcuts.', sm:'Every app lives here. Tap one to open it.' },
    { sel:'#mbSearch', t:'Spotlight search', s:'\u2318K (or Ctrl+K) searches projects, roles and skills from anywhere.', sm:'Tap to search projects, roles and skills.' },
    { sel:'[data-dock="resume"]', t:'The one-pager', s:'The full PDF resume, previewed inline and downloadable in one click.' },
    { sel:'#mbWx', t:'Live weather', s:'Current conditions for the city in the menubar. Hover for the next three days.', sm:'Current conditions for the chosen city. Tap for the next three days.' },
    { sel:'#mbLoc', alt:'#mbClock', t:'Pick a city', s:'New York is home, but the clock and weather can follow you: Seattle, Austin, Tokyo\u2026', sm:'Tap the clock. New York is home, but the time and weather can follow you: Seattle, Austin, Tokyo\u2026' },
    { sel:'#mbPower', t:'Power', s:'Sleep, restart, or shut tigOS down. It will come back when you ask.' },
    { sel:'#mbLogo', t:'tigOS menu', s:'Settings (light mode, accent, dock), the tour, and the terminal. Yes, there is a terminal.', sm:'Settings (light mode, accent, text size), the tour, and the terminal. Yes, there is a terminal.' }
  ];
  var tourEl = null;
  function tourEnd(){ if(tourEl){ tourEl.remove(); tourEl = null; } root.classList.remove('touring'); }
  function tourStart(){ if(typeof closePops === 'function') closePops(); if(!spot.hidden) spotClose(); root.classList.add('touring'); tour(0); }
  function tour(i){
    if(tourEl){ tourEl.remove(); tourEl = null; }
    var step = TOUR[i]; if(!step){ tourEnd(); return; }
    var vis = function(el){ return el && el.getClientRects().length > 0; };
    var target = $(step.sel); if(!vis(target) && step.alt) target = $(step.alt); if(!vis(target)) return tour(i+1);
    var r = target.getBoundingClientRect(), rr = root.getBoundingClientRect(), mob = isMobile();
    tourEl = document.createElement('div'); tourEl.className = 'tour-tip';
    tourEl.innerHTML = '<b>'+step.t+'</b>'+((mob && step.sm) || step.s)+'<div class="row"><button type="button" class="skip">Skip</button><button type="button" class="go">'+(i === TOUR.length-1 ? 'Done' : 'Next')+'</button></div>';
    root.appendChild(tourEl);
    var tw = tourEl.offsetWidth, th = tourEl.offsetHeight;
    var cx = r.left - rr.left + r.width/2, below = r.top - rr.top < rr.height/2;
    tourEl.style.left = Math.max(10, Math.min(rr.width - tw - 10, cx - tw/2))+'px';
    tourEl.style.top = Math.max(8, Math.min(rr.height - th - 8, below ? (r.bottom - rr.top + 12) : (r.top - rr.top - th - 12)))+'px';
    $('.skip', tourEl).addEventListener('click', tourEnd);
    $('.go', tourEl).addEventListener('click', function(){ tour(i+1); });
  }

/* tigOS core app.js, part 24: ios safari share. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------------- iOS Safari / share-sheet bars: measure how much of our bottom edge is actually visible ---------------- */
  (function(){
    if(!('IntersectionObserver' in window)) return;
    var PH = 200, probe = document.createElement('div'); probe.style.cssText = 'position:absolute;left:0;right:0;bottom:0;height:'+PH+'px;pointer-events:none;visibility:hidden;'; root.appendChild(probe);
    var apply = function(hidden){ var lift = Math.max(0, Math.min(150, Math.round(hidden))); root.style.setProperty('--lift', lift+'px'); root.classList.toggle('lifted', lift > 0); };
    try {
      var th = []; for(var i = 0; i <= 40; i++) th.push(i/40);
      var io = new IntersectionObserver(function(es){ var e = es[es.length-1]; if(!e) return; var b = e.boundingClientRect, r = e.intersectionRect;
        if(e.intersectionRatio > 0 && r.top > b.top + 1){ apply(0); return; }              // our top edge is what is clipped, not the bottom
        if(b.height <= 0 || b.top >= (window.innerHeight || 1e9) + 1){ return; }             // probe sits below our own viewport (not the case in practice)
        apply(b.height - r.height);                                                          // 0 when fully visible; PH when the whole strip is under the browser bar
      }, { threshold:th });
      io.observe(probe);
    } catch(e){}
    if(window.visualViewport){ var vv = window.visualViewport, onvv = function(){ var gap = Math.round(window.innerHeight - vv.height - vv.offsetTop); if(gap > 0 && gap < 200) apply(Math.max(gap, parseInt(root.style.getPropertyValue('--lift')) || 0)); }; vv.addEventListener('resize', onvv); onvv(); }
  })();

/* tigOS core app.js, part 25: live wallpaper. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------------- live wallpaper: a WebGL aurora with depth. Three layers of noise drift at different speeds and slide with the cursor at
     different rates (far layer barely, near layer most), so the wallpaper reads as deep rather than flat. It sits under the CSS orbs, renders
     at half resolution at 30 fps, and pauses when a game is full screen, the screen is asleep, the tab is hidden, or motion is reduced.
     The CSS gradient stays underneath as the fallback (Settings > Wallpaper > Still, or no WebGL). ---------------- */
  var WALL = { gl:null, cv:null, on:false, raf:0, last:0, t0:0, px:0, py:0, tx:0, ty:0 };
  var WALL_FRAG = [
    'precision mediump float; uniform vec2 R; uniform float T; uniform vec2 P;',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f); return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }',
    'float fbm(vec2 p){ float v = 0., a = .5; for(int i = 0; i < 5; i++){ v += a*noise(p); p = p*2.03 + vec2(1.7, 9.2); a *= .5; } return v; }',
    'void main(){',
    '  vec2 uv = gl_FragCoord.xy / R; vec2 q = vec2(uv.x * R.x / R.y, uv.y);',
    '  vec3 c = mix(vec3(.145, .086, .224), vec3(.082, .106, .212), uv.x*.6 + (1. - uv.y)*.4);',           /* #251639 -> #151b36, the CSS base */
    '  float far = fbm(q*1.5 + P*.03 + vec2(T*.018, T*.012));',
    '  float mid = fbm(q*2.4 - P*.08 + vec2(-T*.026, T*.02));',
    '  float near = fbm(q*3.8 + P*.17 + vec2(T*.03, -T*.024));',
    '  c += vec3(1., .59, .27) * .52 * smoothstep(.30, .78, far) * (1. - uv.x*1.15) * (uv.y*.7 + .3);',                  /* orange, top left */
    '  c += vec3(.53, .41, 1.) * .58 * smoothstep(.30, .78, mid) * (uv.x*.75 + .25) * (1. - uv.y*1.1);',                  /* violet, bottom right */
    '  c += vec3(1., .35, .59) * .30 * smoothstep(.36, .82, near) * max(0., 1. - abs(uv.x - .55)*1.7) * max(0., 1. - abs(uv.y - .5)*1.7);', /* pink, centre */
    '  c += vec3(.35, .75, 1.) * .26 * smoothstep(.38, .84, mid) * uv.x * uv.y;',                            /* blue, top right */
    '  c += (hash(gl_FragCoord.xy + T) - .5) * .012;',                                                     /* grain against banding */
    '  gl_FragColor = vec4(c, 1.);',
    '}'].join('\n');
  function wallInit(){
    var cv = $('#wallgl'); if(!cv || WALL.gl !== null) return;
    var gl = null; try { gl = cv.getContext('webgl', { antialias:false, alpha:false, depth:false, powerPreference:'low-power' }); } catch(e){}
    if(!gl){ WALL.gl = false; return; }
    /* a software renderer (SwiftShader, llvmpipe: no GPU, or a headless browser) would spend the CPU the desktop needs; fall back to the CSS gradient. ?gl=1 forces it on for testing */
    var dbg = gl.getExtension('WEBGL_debug_renderer_info'), renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
    if(/swiftshader|llvmpipe|softpipe|software/i.test(renderer) && !/[?&]gl=1/.test(location.search)){ WALL.gl = false; WALL.soft = renderer; cv.setAttribute('data-soft', '1'); return; }
    var mk = function(type, src){ var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    try {
      var prog = gl.createProgram();
      gl.attachShader(prog, mk(gl.VERTEX_SHADER, 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0., 1.); }'));
      gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, WALL_FRAG)); gl.linkProgram(prog);
      if(!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var a = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
      WALL.u = { R:gl.getUniformLocation(prog, 'R'), T:gl.getUniformLocation(prog, 'T'), P:gl.getUniformLocation(prog, 'P') };
    } catch(e){ WALL.gl = false; return; }
    WALL.gl = gl; WALL.cv = cv; WALL.t0 = performance.now();
    document.addEventListener('pointermove', function(e){ if(e.pointerType === 'touch') return; WALL.tx = (e.clientX/innerWidth - .5)*2; WALL.ty = (e.clientY/innerHeight - .5)*-2; }, { passive:true });
  }
  function wallWants(){ return PREF.wall !== 'still' && PREF.motion !== 'off' && !document.hidden && (!sleepEl || sleepEl.hidden) && !root.classList.contains('gaming'); }
  function wallApply(){
    if(WALL.gl === null) wallInit(); if(!WALL.gl) return;
    WALL.cv.classList.toggle('on', PREF.wall !== 'still' && PREF.motion !== 'off');
    var want = wallWants();
    if(want && !WALL.on){ WALL.on = true; WALL.raf = requestAnimationFrame(wallFrame); }
    if(!want && WALL.on){ WALL.on = false; cancelAnimationFrame(WALL.raf); }
  }
  function wallFrame(ts){
    if(!WALL.on) return; WALL.raf = requestAnimationFrame(wallFrame);
    if(ts - WALL.last < 33) return; WALL.last = ts;
    var gl = WALL.gl, cv = WALL.cv, w = Math.max(2, (cv.clientWidth/2) | 0), h = Math.max(2, (cv.clientHeight/2) | 0);
    if(cv.width !== w || cv.height !== h){ cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); }
    WALL.px += (WALL.tx - WALL.px)*.04; WALL.py += (WALL.ty - WALL.py)*.04;
    gl.uniform2f(WALL.u.R, w, h); gl.uniform1f(WALL.u.T, (ts - WALL.t0)*.001); gl.uniform2f(WALL.u.P, WALL.px, WALL.py);
    gl.drawArrays(gl.TRIANGLES, 0, 3); WALL.frames = (WALL.frames || 0) + 1; if((WALL.frames & 7) === 1) cv.setAttribute('data-frames', WALL.frames);
  }
  document.addEventListener('visibilitychange', wallApply);
  new MutationObserver(wallApply).observe(root, { attributes:true, attributeFilter:['class'] });
  new MutationObserver(wallApply).observe(sleepEl, { attributes:true, attributeFilter:['hidden'] });
  wallApply();
/* tigOS core app.js, part 26: screensavers. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------------- screensavers. Drift (20-power.js, driftStart) was the only one; these join it. saverStart(kind) is the one entry point:
     the power menu and `sleep` use the chosen default (Settings > Screensaver), `screensaver <name>` starts a specific one, and an idle timer
     (Settings > Start after) starts it on its own. Any key, click or real mouse movement wakes. ---------------- */
  var PAL = ['#ff8a00', '#ffd166', '#63e6be', '#8cc7ff', '#ff7ab6', '#a78bfa'];
  var SAVERS = {
    drift: { name:'Drift', sub:'luminous strands that sway like kelp' },
    warp: { name:'Warp', sub:'a starfield at speed',
      init:function(W, H){ var s = []; for(var i = 0; i < (isMobile() ? 220 : 520); i++) s.push({ x:(Math.random()-.5)*2, y:(Math.random()-.5)*2, z:Math.random()*.95 + .05, c:PAL[i % PAL.length] }); return { stars:s }; },
      draw:function(c, S, t, dt, W, H){
        c.fillStyle = 'rgba(4,4,10,.55)'; c.fillRect(0, 0, W, H);
        var sp = .32 + .28*(.5 + .5*Math.sin(t*.35)), cx = W/2, cy = H/2, sc = Math.max(W, H)*.5;
        c.lineCap = 'round';
        for(var i = 0; i < S.stars.length; i++){
          var s = S.stars[i], z0 = s.z; s.z -= dt*sp; if(s.z <= .02){ s.x = (Math.random()-.5)*2; s.y = (Math.random()-.5)*2; s.z = 1; z0 = 1; }
          var x0 = cx + s.x/z0*sc, y0 = cy + s.y/z0*sc, x1 = cx + s.x/s.z*sc, y1 = cy + s.y/s.z*sc;
          if(x1 < -20 || x1 > W+20 || y1 < -20 || y1 > H+20) continue;
          c.strokeStyle = s.c; c.globalAlpha = Math.min(1, (1 - s.z)*1.3); c.lineWidth = (1 - s.z)*3 + .5;
          c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
        }
        c.globalAlpha = 1;
      } },
    bounce: { name:'Bounce', sub:'the logo, bouncing. It changes colour on every wall and celebrates a corner',
      init:function(W, H){ var m = isMobile(), w = m ? 132 : 220, h = m ? 78 : 130; return { x:Math.random()*(W-w), y:Math.random()*(H-h), w:w, h:h, vx:(m ? 110 : 170)*(Math.random() < .5 ? -1 : 1), vy:(m ? 90 : 135)*(Math.random() < .5 ? -1 : 1), ci:0, corner:0, corners:0, bits:[] }; },
      draw:function(c, S, t, dt, W, H){
        c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
        S.x += S.vx*dt; S.y += S.vy*dt; var hx = false, hy = false;
        if(S.x <= 0){ S.x = 0; S.vx = Math.abs(S.vx); hx = true; } if(S.x + S.w >= W){ S.x = W - S.w; S.vx = -Math.abs(S.vx); hx = true; }
        if(S.y <= 0){ S.y = 0; S.vy = Math.abs(S.vy); hy = true; } if(S.y + S.h >= H){ S.y = H - S.h; S.vy = -Math.abs(S.vy); hy = true; }
        if(hx || hy){ S.ci = (S.ci + 1) % PAL.length; }
        if(hx && hy){ S.corner = 1.8; S.corners++; for(var i = 0; i < 90; i++) S.bits.push({ x:S.x + S.w/2, y:S.y + S.h/2, vx:(Math.random()-.5)*640, vy:(Math.random()-.9)*640, c:PAL[i % PAL.length], l:1 + Math.random() }); }
        var col = PAL[S.ci], g = c.createLinearGradient(S.x, S.y, S.x + S.w, S.y + S.h); g.addColorStop(0, col); g.addColorStop(1, '#ffffff');
        c.save(); c.shadowColor = col; c.shadowBlur = 40; c.fillStyle = g; c.beginPath(); var r = S.h*.22; c.moveTo(S.x + r, S.y); c.arcTo(S.x + S.w, S.y, S.x + S.w, S.y + S.h, r); c.arcTo(S.x + S.w, S.y + S.h, S.x, S.y + S.h, r); c.arcTo(S.x, S.y + S.h, S.x, S.y, r); c.arcTo(S.x, S.y, S.x + S.w, S.y, r); c.closePath(); c.fill(); c.restore();
        c.fillStyle = '#0b0b10'; c.font = '800 '+Math.round(S.h*.42)+'px -apple-system, BlinkMacSystemFont, Inter, Helvetica, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('tigOS', S.x + S.w/2, S.y + S.h/2 + 2);
        for(var k = S.bits.length - 1; k >= 0; k--){ var b = S.bits[k]; b.l -= dt; if(b.l <= 0){ S.bits.splice(k, 1); continue; } b.vy += 900*dt; b.x += b.vx*dt; b.y += b.vy*dt; c.fillStyle = b.c; c.globalAlpha = Math.min(1, b.l); c.fillRect(b.x, b.y, 6, 6); }
        c.globalAlpha = 1;
        if(S.corner > 0){ S.corner -= dt; c.fillStyle = 'rgba(255,255,255,'+Math.min(1, S.corner)+')'; c.font = '800 '+Math.round(H*.09)+'px -apple-system, BlinkMacSystemFont, Inter, Helvetica, sans-serif'; c.fillText('CORNER!', W/2, H*.5); }
        if(S.corners){ c.fillStyle = 'rgba(255,255,255,.35)'; c.font = '600 13px ui-monospace, Menlo, monospace'; c.textAlign = 'right'; c.fillText('corners: '+S.corners, W - 18, 22); }
      } },
    matrix: { name:'Matrix', sub:'glyph rain. Read the columns',
      init:function(W, H){ var cw = isMobile() ? 14 : 18, n = Math.ceil(W/cw), cols = [], words = ['HIRE CHASE', 'TIGOS', 'MARKETING', 'CLEAR', 'CHASETIGER.COM', 'GTM', 'GROWTH'];
        for(var i = 0; i < n; i++) cols.push({ y:Math.random()*-H, sp:(isMobile() ? 120 : 160) + Math.random()*260, k:0, word:(i % 7 === 3) ? words[Math.floor(Math.random()*words.length)] : null, wi:0, acc:0 });
        return { cw:cw, cols:cols, glyphs:'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789TIGOS<>/*+=' }; },
      draw:function(c, S, t, dt, W, H){
        c.fillStyle = 'rgba(0,0,0,.16)'; c.fillRect(0, 0, W, H);
        c.font = '600 '+Math.round(S.cw*.9)+'px ui-monospace, Menlo, Consolas, monospace'; c.textAlign = 'center'; c.textBaseline = 'top';
        for(var i = 0; i < S.cols.length; i++){
          var col = S.cols[i]; col.acc += col.sp*dt; if(col.acc < S.cw) continue; col.acc = 0; col.y += S.cw;
          if(col.y > H + S.cw*4){ col.y = -S.cw*Math.floor(Math.random()*30); col.wi = 0; continue; }
          var ch = col.word ? col.word[col.wi++ % col.word.length] : S.glyphs[Math.floor(Math.random()*S.glyphs.length)];
          var x = i*S.cw + S.cw/2;
          c.fillStyle = col.word ? '#ffd166' : '#b8ffcf'; c.fillText(ch, x, col.y);
          c.fillStyle = col.word ? 'rgba(255,138,0,.85)' : 'rgba(40,200,64,.85)'; c.fillText(ch, x, col.y - S.cw);
        }
      } }
  };
  function saverStart(kind){
    var cv = $('#saver'); if(!cv || SAVER.on) return;
    kind = kind || PREF.saver || 'drift'; if(kind === 'random' || !SAVERS[kind]){ var ks = Object.keys(SAVERS); kind = ks[Math.floor(Math.random()*ks.length)]; }
    cv.setAttribute('data-kind', kind);
    if(kind === 'drift'){ driftStart(); return; }
    SAVER.on = true; cv.setAttribute('data-run', '1');
    var ctx = cv.getContext('2d'), W, H, S, sv = SAVERS[kind];
    var size = function(){ W = cv.width = root.clientWidth; H = cv.height = root.clientHeight; S = sv.init(W, H); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); };
    size(); window.addEventListener('resize', size);
    var last = 0, t0 = performance.now();
    var frame = function(ts){
      if(!SAVER.on){ window.removeEventListener('resize', size); return; }
      SAVER.raf = requestAnimationFrame(frame);
      if(ts - last < (isMobile() ? 40 : 16)) return; var dt = Math.min(.05, (ts - (last || ts))*.001); last = ts;
      sv.draw(ctx, S, (ts - t0)*.001, dt, W, H);
    };
    SAVER.raf = requestAnimationFrame(frame);
  }
  /* idle: no key, click, wheel or mouse movement for Settings > Start after minutes. Never while a game is open, on the login or off screens, or in a hidden tab. */
  var IDLE = { last:performance.now(), shown:0 };
  ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function(ev){ document.addEventListener(ev, function(){ IDLE.last = performance.now(); }, { passive:true, capture:true }); });
  setInterval(function(){
    var m = parseFloat(PREF.idle); if(!(m > 0) || performance.now() - IDLE.last < m*60000) return;
    if(!sleepEl.hidden || !offEl.hidden || !loginEl.hidden || document.hidden || root.classList.contains('booting') || root.classList.contains('gaming') || $('.win[data-app="games"]')) return;
    sleepEl.hidden = false; tick(); saverStart(); IDLE.last = performance.now();
  }, 2000);
  new MutationObserver(function(){ if(!sleepEl.hidden) IDLE.shown = performance.now(); }).observe(sleepEl, { attributes:true, attributeFilter:['hidden'] });
  sleepEl.addEventListener('pointermove', function(e){ if(e.pointerType !== 'touch' && performance.now() - IDLE.shown > 1500) wake(); });
/* tigOS core app.js, part 27: eggs. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------------- easter eggs: the Konami code throws a party (wallpaper cycles hue, the dock and pets dance, confetti, a jingle if the
     arcade synth is loaded), `do a barrel roll` rolls the whole desktop once, `sl` runs the classic locomotive across the terminal.
     Terminal commands from this part and the screensavers are registered through EXTRA_CMDS (13-pets.js merges them into CMD). ---------------- */
  var KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'], kIdx = 0, PARTY = { t:0, raf:0 };
  document.addEventListener('keydown', function(e){
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    kIdx = (k === KONAMI[kIdx]) ? kIdx + 1 : (k === KONAMI[0] ? 1 : 0);
    if(kIdx === KONAMI.length){ kIdx = 0; party(true, 'You found the Konami code.'); }
  });
  function confetti(on){
    var cv = $('#confetti'); if(!cv) return; cancelAnimationFrame(PARTY.raf);
    if(!on){ cv.hidden = true; return; }
    cv.hidden = false; var c = cv.getContext('2d'), W = cv.width = root.clientWidth, H = cv.height = root.clientHeight, bits = [], last = 0, born = performance.now();
    var spawn = function(n){ for(var i = 0; i < n; i++) bits.push({ x:Math.random()*W, y:-20 - Math.random()*H*.3, vx:(Math.random()-.5)*120, vy:60 + Math.random()*160, r:Math.random()*6.28, vr:(Math.random()-.5)*8, c:PAL[i % PAL.length], w:6 + Math.random()*6, h:8 + Math.random()*8 }); };
    spawn(160);
    var frame = function(ts){
      if(cv.hidden) return; PARTY.raf = requestAnimationFrame(frame);
      var dt = Math.min(.05, (ts - (last || ts))*.001); last = ts; c.clearRect(0, 0, W, H);
      if(ts - born < 6500 && Math.random() < .5) spawn(2);
      for(var k = bits.length - 1; k >= 0; k--){ var b = bits[k]; b.vy += 30*dt; b.x += (b.vx + Math.sin(ts*.002 + b.r)*40)*dt; b.y += b.vy*dt; b.r += b.vr*dt; if(b.y > H + 30){ bits.splice(k, 1); continue; }
        c.save(); c.translate(b.x, b.y); c.rotate(b.r); c.fillStyle = b.c; c.fillRect(-b.w/2, -b.h/2, b.w, b.h); c.restore(); }
      if(!bits.length) cv.hidden = true;
    };
    PARTY.raf = requestAnimationFrame(frame);
  }
  function jingle(){ var s = window.TIG_SFX; if(!s) return; try { [523, 659, 784, 1047, 784, 1047].forEach(function(f, i){ s.tone('triangle', f, f, .16, .12, i*.11); }); } catch(e){} }
  function party(on, why){
    clearTimeout(PARTY.t); if(on === undefined) on = !root.classList.contains('party');
    root.classList.toggle('party', on);
    if(on){ toast('Party mode', why || 'Everything dances for nine seconds.'); confetti(true); jingle(); PARTY.t = setTimeout(function(){ party(false); }, 9000); }
    else confetti(false);
  }
  function barrelRoll(){ if(root.classList.contains('roll') || PREF.motion === 'off') return; root.classList.add('roll'); setTimeout(function(){ root.classList.remove('roll'); }, 1300); }
  var TRAIN = [
    '      ====        ________                ___________ ',
    '  _D _|  |_______/        \\__I_I_____===__|_________| ',
    '   |(_)---  |   H\\________/ |   |        =|___ ___|   ',
    '   /     |  |   H  |  |     |   |         ||_| |_||   ',
    '  |      |  |   H  |__--------------------| [___] |   ',
    '  | ________|___H__/__|_____/[][]~\\_______|       |   ',
    '  |/ |   |-----------I_____I [][] []  D   |=======|__ ',
    '__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__ ',
    ' |/-=|___|=    ||    ||    ||    |_____/~\\___/        ',
    '  \\_/      \\O=====O=====O=====O_/      \\_/            '];
  var EXTRA_CMDS = {
    screensaver: function(a, T){
      a = (a || '').trim().toLowerCase(); var p = a.split(/\s+/);
      if(!a || a === 'list' || a === 'help'){ T.print('screensavers: '+Object.keys(SAVERS).map(function(k){ return T.o(k)+(PREF.saver === k ? ' *' : ''); }).join('  ')+'  '+T.o('random')+(PREF.saver === 'random' ? ' *' : '')); T.print('usage: screensaver &lt;name&gt;  \u00b7  screensaver use &lt;name&gt;  \u00b7  screensaver idle &lt;minutes|off&gt;   (starts after '+(PREF.idle === 'off' ? 'never' : PREF.idle+' min')+')'); return; }
      if(p[0] === 'idle'){ if(!p[1]){ T.print('starts after: '+(PREF.idle === 'off' ? 'never' : PREF.idle+' min')); return; } var v = /^off|never|0$/.test(p[1]) ? 'off' : String(parseFloat(p[1]) || 'off'); setPref('idle', v); T.print('screensaver starts after '+(v === 'off' ? 'never' : v+' min'), 'ok'); return; }
      if(p[0] === 'use' || p[0] === 'set'){ if(SAVERS[p[1]] || p[1] === 'random'){ setPref('saver', p[1]); T.print('default screensaver: '+p[1], 'ok'); } else T.print('no screensaver called '+esc(p[1] || '')+'. try: '+Object.keys(SAVERS).join(', ')+', random', 'err'); return; }
      if(SAVERS[p[0]] || p[0] === 'random'){ T.print('starting '+p[0]+'\u2026 move the mouse or press a key to wake'); setTimeout(function(){ sleepEl.hidden = false; tick(); saverStart(p[0]); }, 350); return; }
      T.print('no screensaver called '+esc(p[0])+'. try: '+Object.keys(SAVERS).join(', ')+', random', 'err');
    },
    party: function(a, T){ var off = /^(off|stop|no|end)/i.test(a || ''); party(!off, 'You asked for it.'); T.print(off ? 'party over. back to work.' : 'party mode on for nine seconds.', 'ok'); },
    'do': function(a, T){ if(/barrel\s*roll/i.test(a || '')){ barrelRoll(); T.print('whee.', 'ok'); } else T.print('do what? try: '+T.o('do a barrel roll')); },
    sl: function(a, T){ T.art(TRAIN, 'train'); },
    konami: function(a, T){ T.print('up up down down left right left right b a. anywhere on the desktop.'); }
  };
/* tigOS core app.js, part 28: boot. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------------- boot ---------------- */
  var booted = false;
  function bootSeq(toLogin){
    var msgs = ['Starting up', 'Loading portfolio', 'Mounting resume.pdf', 'Checking the weather', 'Ready'];
    var el = $('#bootMsg'); var i = 0; el.textContent = msgs[0];
    var iv = setInterval(function(){ i++; if(msgs[i]) el.textContent = msgs[i]; else clearInterval(iv); }, 440);
    setTimeout(function(){
      if(toLogin){ root.classList.add('handoff'); loginScreen(); root.classList.remove('booting'); setTimeout(function(){ root.classList.remove('handoff'); }, 560); }   /* login fades in over the boot card; the boot only drops away once it is opaque */
      else root.classList.remove('booting');
      if(!booted){ booted = true; setTimeout(function(){ toast('Welcome to tigOS', isMobile() ? 'Tap an app in the dock to start.' : 'Open Projects, or press \u2318K to search.'); }, 700); }
    }, 2250);
  }
  bootSeq();
  function reclamp(){
    if(isMobile()) return;
    Object.keys(WM.wins).forEach(function(k){
      var w = WM.wins[k];
      var ar = area();
      if(w.max){ w.el.style.left = ar.x0+'px'; w.el.style.width = (ar.x1 - ar.x0)+'px'; w.el.style.height = ar.y1+'px'; return; }
      var lim = ar.y1, cy = w.el.offsetTop + w.el.offsetHeight/2;   // remember the centre first
      if(w.el.offsetHeight > lim - 10){ w.el.style.height = Math.max(240, lim - 10)+'px'; }
      var h = w.el.offsetHeight;
      if(w.el.offsetTop < 0 || w.el.offsetTop + h > lim){ w.el.style.top = Math.max(0, Math.min(lim - h, Math.round(cy - h/2)))+'px'; }   // re-centre, never jump to the top
    });
  }
  window.addEventListener('resize', reclamp);
  setTimeout(function(){ arcade(); }, 600);   /* fetch the arcade once the desktop is up */
})();

