// Build paragraphs for each section based on product names/descriptions and items
export function buildSectionParagraphs(sections: any[], products: any[], items: any[]) {
  const itemsBySection: Record<string, any[]> = {};
  items.forEach(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return;
    if (!itemsBySection[product.section]) itemsBySection[product.section] = [];
    itemsBySection[product.section].push({ product, item });
  });

  const results: { sectionId: string; sectionName: string; paragraph: string }[] = [];

  sections.forEach(section => {
    const sectionItems = itemsBySection[section.id];
    if (!sectionItems || sectionItems.length === 0) return;

    const SSColumns: string[] = [];
    const steelBeams: string[] = [];
    const RHSsteel: string[] = [];
    const VeluxRL: string[] = [];
    const RoofLantern: string[] = [];
    const Slimglaze: string[] = [];
    const whiteUPVC: string[] = [];
    const greyAluminium: string[] = [];
    const glazingVision: string[] = [];
    const otherItems: string[] = [];

    let SSColumnsDesc = "";
    let steelBeamsDesc = "";
    let RHSsteelDesc = "";
    let VeluxDesc = "";
    let RoofLanternDesc = "";
    let SlimglazeDesc = "";
    let whiteUPVCDesc = "";
    let greyAluminiumDesc = "";
    let glazingVisionDesc = "";

    sectionItems.forEach(({ product, item }) => {
      const valueUnit = product.valueType === "unit" ? "" : product.valueType === "meter" ? "m" : "m²";

      const nameLower = (product.name || "").toLowerCase();
      const descLower = (product.description || "").toLowerCase();

      if (nameLower.includes("structural support columns")) {
        SSColumns.push(`${item.value}x`);
        if (!SSColumnsDesc) SSColumnsDesc = product.description;
      } else if (nameLower.includes("steel beams")) {
        steelBeams.push(`${item.quantity}x${item.value}${valueUnit}`);
        if (!steelBeamsDesc) steelBeamsDesc = product.description;
      } else if (nameLower.includes("rhs steel")) {
        RHSsteel.push(`${item.value}x`);
        if (!RHSsteelDesc) RHSsteelDesc = product.description;
      } else if (descLower.includes("velux rooflight")) {
        VeluxRL.push(`${item.quantity}x ${product.name}`);
        if (!VeluxDesc) VeluxDesc = product.description;
      } else if (descLower.includes("roof lantern")) {
        RoofLantern.push(`${item.value}x ${product.name}`);
        if (!RoofLanternDesc) RoofLanternDesc = product.description;
      } else if (descLower.includes("slimglaze")) {
        Slimglaze.push(`${item.value}x ${product.name}`);
        if (!SlimglazeDesc) SlimglazeDesc = product.description;
      } else if (descLower.includes("white upvc")) {
        whiteUPVC.push(`${item.value}x ${product.name}`);
        if (!whiteUPVCDesc) whiteUPVCDesc = product.description;
      } else if (descLower.includes("grey aluminium")) {
        greyAluminium.push(`${item.value}x ${product.name}`);
        if (!greyAluminiumDesc) greyAluminiumDesc = product.description;
      } else if (descLower.includes("glazing vision")) {
        glazingVision.push(`${item.value}x ${product.name}`);
        if (!glazingVisionDesc) glazingVisionDesc = product.description;
      } else {
        if (item.value === 1) otherItems.push(`${product.description}`);
        if (item.value > 1) otherItems.push(`${item.value}x ${product.description}`);
      }
    });

    function formatValueArray(arr: string[], description: string) {
      if (!arr.length) return null;
      if (arr.length === 1) return `${arr[0]} ${description}`;
      const last = arr[arr.length - 1];
      const rest = arr.slice(0, -1);
      return `${rest.join(", ")} and ${last} ${description}`;
    }

    function formatNameArray(arr: string[], description: string) {
      if (!arr.length) return null;
      if (arr.length === 1) return `${arr[0]} ${description}`;
      const last = arr[arr.length - 1];
      const rest = arr.slice(0, -1);
      return `${rest.join(", ")} and ${last} ${description}`;
    }

    const descriptions = [
      formatValueArray(SSColumns, SSColumnsDesc || "Structural Support Columns"),
      formatValueArray(steelBeams, steelBeamsDesc || "Steel Beams"),
      formatValueArray(RHSsteel, RHSsteelDesc || "RHS Steel"),

      formatNameArray(VeluxRL, VeluxDesc || "Velux Rooflight"),
      formatNameArray(RoofLantern, RoofLanternDesc || "Roof Lantern"),
      formatNameArray(Slimglaze, SlimglazeDesc || "Slimglaze SG2Double"),
      formatNameArray(whiteUPVC, whiteUPVCDesc || "White UPVC Window"),
      formatNameArray(greyAluminium, greyAluminiumDesc || "Grey Aluminium Window"),
      formatNameArray(glazingVision, glazingVisionDesc || "Glazing Vision Window"),
      ...otherItems
    ].filter(Boolean) as string[];

    const paragraph = descriptions.join(", ") + ".";

    results.push({ sectionId: section.id, sectionName: section.name, paragraph });
  });

  return results;
}
