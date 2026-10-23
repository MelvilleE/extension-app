import type { QuoteType, QuoteTypeConfig } from "@/types/quotation";

const sharedBriefEnding = `The following outlines what is included within our quotation, along with a separate section covering required items such as Building Control and asbestos surveys, as well as potential extras like tiling or a new boiler.

Any additional works are managed through our formal change order process, overseen by your dedicated Project Manager. This ensures full transparency, with no additional costs incurred without your prior approval.

We have also attached a brochure, which provides a more in-depth explanation of our delivery, standards, and processes.

As members of the Federation of Master Builders, with Chartered CIOB Directors and working under JCT contracts, we operate to the highest industry standards, giving you confidence in both the quality of our work and the way your project is managed from start to finish.`;

const extensionPricingText = `This price is based on material and labour costs at the time of the estimate, using up to date price lists, which are generally stable barring major crises. During the build-ready process there’s usually a gap between contract signing and the start date. Our aim to begin projects promptly, delays beyond our control can happen, affecting start times and costs. If material or labour prices increase due to inflation or other external factors, we ask for flexibility and fairness in addressing these changes. We will always justify any necessary price adjustments, and if costs decrease, adjust prices to ensure fairness.

ESTABLISHING THE END COST

It is our intention to produce a quotation that will leave you with a realistic figure for budgeting purposes. We endeavour to take into consideration every aspect of the project so that you have a realistic figure for budgeting purposes.

For clarity, items to consider include flooring, possible changes to existing doors and decorating, sanitary ware, ceramic tiles, decoration, kitchen supply, underfloor heating, fire doors and additional smoke alarms, Building Control costs, structural support changes required by the engineer and existing floor upgrades that may be required to meet Building Regulations.

All of the above can be carried out by ourselves once we are able to define the required sizes, styles and finishes.

FOR CONSIDERATION

We adopt an open approach in how your extension is built and how it can look on completion. As long as a change is structurally viable, we are happy to discuss ideas and carry out the works accordingly.`;

const loftPricingText = `This is your total cost for the build detailed above and is valid for 2 weeks from the date of issue due to the current economic climate. The quote is subject to alterations unspecified that may arise from final survey, structural drawings, council planning or Building Control changes.

This price is based on material and labour costs at the time of the estimate, using up to date price lists. If material or labour prices increase because of inflation or other external factors, we ask for flexibility and fairness in addressing these changes. We will always justify any necessary price adjustments and, if costs decrease, adjust prices to ensure fairness.

ESTABLISHING THE END COST

It is our intention to produce a quotation that will leave you with a realistic figure for budgeting purposes. Items to consider include flooring, possible changes to existing doors and decorating, sanitary ware, ceramic tiles, decoration, fire doors and additional smoke alarms, and Building Control costs.

All of the above can be carried out by ourselves once we are able to define the required sizes, styles and finishes.

FOR CONSIDERATION

We adopt an open approach in how your loft is built and how it can look on completion. As long as a change is structurally viable, we are happy to discuss ideas and carry out the works accordingly.`;

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
