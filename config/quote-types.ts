import type { QuoteType, QuoteTypeConfig } from "@/types/quotation";

const sharedBriefEnding = `The following outlines what is included within our quotation, along with a separate section covering required items such as Building Control and asbestos surveys, as well as potential extras like tiling or a new boiler.

Any additional works are managed through our formal change order process, overseen by your dedicated Project Manager. This ensures full transparency, with no additional costs incurred without your prior approval.

We have also attached a brochure, which provides a more in-depth explanation of our delivery, standards, and processes.

As members of the Federation of Master Builders, with Chartered CIOB Directors and working under JCT contracts, we operate to the highest industry standards, giving you confidence in both the quality of our work and the way your project is managed from start to finish.`;

const extensionPricingText = `This price is based on material and labour costs at the time of the estimate, using up to date price lists, which are generally stable barring major crises. During the build-ready process there’s usually a gap between contract signing and the start date. Our aim to begin projects promptly, delays beyond our control can happen, affecting start times and costs. If material or labour prices increase due to inflation or other external factors, we ask for flexibility and fairness in addressing these changes. We will always justify any necessary price adjustments, and if costs decrease, adjust prices to ensure fairness.

ESTABLISHING THE END COST

It is our intention to produce a quotation that will leave you with a realistic figure for budgeting purposes. We endeavor to take into consideration, every aspect of the project, in order that you do not fall foul of a building project that has over running costs, and with this in mind the following is a list of items you have not been allowed for but will need to be established in order to define the end cost.

For clarity, the following is a list of items for you to take into consideration to help establish the end cost. 

Flooring – carpet, tile, wood etc…
Possible change of existing doors, if applicable, and decorating
Sanitary Ware
Ceramic tiles
Decoration
Kitchen supply
Underfloor heating
Fire Doors and additional smoke alarms if needed
Cost of building inspector
These costs are based on the structural supports listed and subject to change should engineer see fit
Existing floor work, may need altering improving to bring up to Building regulations

All of the above can be carried out by ourselves, once we are able to define the required sizes, styles, finishes etc.

FOR CONSIDERATION

In order that we extend the courtesy of choice wherever we can, we adopt an open approach in how your Extension is to be built, and, therefore, how it can look on completion.

This is very much born out of a ‘can do’ attitude we choose to have, resulting in many varied styles and finishes we achieve in the extensions we carry out. Our work, therefore, reflects a more considered approach, which may indeed stray from the plan. Our concern is not how quickly we can finish and move on to the next project without interruption, but to build with your involvement. This might take a little longer! As long as it is structurally viable, we are happy to talk through changes/ideas you may have and carry out the works accordingly.`;

const loftPricingText = `

Establishing This Quote:

* includes fitting client supplied sanitary ware, subject to site of materials, additional cost maybe incurred for complex sanitary ware
**Shelving and rails not included
*** decorative handrails and spindles or hardwoods to be costed as extra.
**** Final WC location subject to onsite survey during build.

This is your total cost for the build detailed above and is valid for 2 weeks from the date of issue
due to the current economic climate. (see extras for exclusions) Quote is subject to alterations
unspecified that may arise from final survey, structural drawings, council planning or building control
changes. *
This price is based on material and labour costs at the time of the estimate, using up to date price
lists, which are generally stable barring major crises. During the build-ready process there’s usually
a gap between contract signing and the start date. Our aim to begin projects promptly, delays
beyond our control can happen, affecting start times and costs. If material or labour prices increase
due to inflation or other external factors, we ask for flexibility and fairness in addressing these
changes. We will always justify any necessary price adjustments, and if costs decrease, adjust
prices to ensure fairness.

ESTABLISHING THE END COST
It is our intention to produce a quotation that will leave you with a realistic figure for budgeting purposes. We endeavor to take into consideration, every aspect of the project, in order that you do not fall foul of a building project that has over running costs, and with this in mind the following is a list of items you have not been allowed for but will need to be established in order to define the end cost.
For clarity, the following is a list of items for you to take into consideration to help establish the end cost.
 
Flooring – carpet, tile, wood etc…
Possible change of existing doors, if applicable, and decorating
Sanitary Ware
Ceramic tiles
Decoration
Fire Doors and additional smoke alarms if needed
Cost of building inspector
 
All of the above can be carried out by ourselves, once we are able to define the required sizes, styles, finishes etc.
 
FOR CONSIDERATION
In order that we extend the courtesy of choice wherever we can, we adopt an open approach in how your loft is to be built, and, therefore, how it can look on completion.
 
This is very much borne out of a ‘can do’ attitude we choose to have, resulting in many varied styles and finishes we achieve in the loft conversions we carry out. Our work, therefore, reflects a more considered approach, which may indeed stray from the plan. Our concern is not how quickly we can finish and move on to the next project without interruption, but to build with your involvement. This might take a little longer! As long as it is structurally viable, we are happy to talk through changes/ideas you may have and carry out the works accordingly.`;

export const quoteTypeConfigs: Record<QuoteType, QuoteTypeConfig> = {
  extension: {
    id: "extension",
    label: "Extension",
    pluralLabel: "Extensions",
    pageClassName: "bg-gradient-to-br from-blue-50 to-indigo-100",
    defaultBrief: `Thank you again for the opportunity to quote for your build. This quotation is based on our recent discussions regarding the proposed extension to your home.\n\n${sharedBriefEnding}`,
    defaultPricingText: extensionPricingText,
  },
  loft: {
    id: "loft",
    label: "Loft",
    pluralLabel: "Lofts",
    pageClassName: "bg-gradient-to-br from-green-50 to-green-100",
    defaultBrief: `Thank you again for the opportunity to quote for your build. This quotation is based on our recent discussions regarding the proposed loft.\n\n${sharedBriefEnding}`,
    defaultPricingText: loftPricingText,
  },
};

export function getQuoteTypeConfig(type: QuoteType) {
  return quoteTypeConfigs[type];
}
