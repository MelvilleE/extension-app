"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Download, Edit, Save } from "lucide-react";
import { jsPDF } from "jspdf";
// PdfPreview removed: preview UI disabled per request
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor } from "@dnd-kit/core";
import {arrayMove, SortableContext, verticalListSortingStrategy, useSortable} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion";
// note: removed a stray Node-only import and an unused Radix import



// Types
type UserRole = "user" | "admin";
type ValueType = "unit" | "meter" | "meterage";


interface Product {
  id: string;
  name: string;
  description: string;
  section: string;
  baseCost: number;
  supplier: string;
  markupPercent: number;
  price: number;
  valueType: ValueType;
  isCustomPricing?: boolean;
  customPrices?: { value: number; price: number }[];
}

interface Section {
  id: string;
  name: string;
}

interface QuotationItem {
  id: string; // Unique ID for each item instance
  productId: string;
  value: number; // Length/area/dimension
  quantity: number; // Number of units
  showQuantity: boolean;
}

interface QuotationFormData {
  name: string;
  address: string;
  items: QuotationItem[];
}

interface SavedQuote {
  id: string;
  customerName: string;
  title: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  formData: QuotationFormData;
}
// Initial data
const initialSections: Section[] = [
  { id: "windows", name: "Windows" },
  { id: "doors", name: "Doors" },
  { id: "steels", name: "Steels" },
  { id: "carpentry", name: "Carpentry" },
];


const initialProducts: Product[] = [
  { 
    id: "w1", 
    name: "Double Glazed Window", 
    description: "Standard uPVC double glazed window with white finish",
    section: "windows", 
    baseCost: 200,
    supplier: "ABC Windows Ltd",
    markupPercent: 25,
    price: 250,
    valueType: "unit",
  },
  { 
    id: "w2", 
    name: "French Window", 
    description: "Full height uPVC French door with double glazing",
    section: "windows",
    baseCost: 320,
    supplier: "ABC Windows Ltd",
    markupPercent: 25, 
    price: 400,
    valueType: "unit",
  },
  { 
    id: "d1", 
    name: "Front Door", 
    description: "Solid core composite front door with security features",
    section: "doors", 
    baseCost: 640,
    supplier: "ABC Windows Ltd",
    markupPercent: 25,
    price: 800,
    valueType: "unit",
  },
  { 
    id: "d2", 
    name: "Patio Door", 
    description: "Sliding patio door with aluminum frame",
    section: "doors", 
    baseCost: 960,
    supplier: "ABC Windows Ltd",
    markupPercent: 25,
    price: 1200,
    valueType: "unit",
  },
  { 
    id: "s1", 
    name: "Steel Beam", 
    description: "Standard steel I-beam for structural support",
    section: "steels",
    baseCost: 120,
    supplier: "ABC Windows Ltd",
    markupPercent: 25, 
    price: 150,
    valueType: "meter",
  },
  { 
    id: "r1", 
    name: "Roof Installation", 
    description: "Complete roof installation including trusses and covering",
    section: "carpentry", 
    baseCost: 0,
    supplier: "ABC Windows Ltd",
    markupPercent: 0,
    price: 0,
    valueType: "meterage",
    isCustomPricing: true,
    customPrices: [
      { value: 10, price: 1700 },
      { value: 15, price: 1400 },
      { value: 20, price: 1000 }
    ]
  },
];

const DEFAULT_COMPANY_DESCRIPTION = `
Prelims:  Preparation of structural calculations & building regulation drawings including submission to inspector. (cost of inspector additional) (based on plans 1416/559-SK01)

Description: 6.6m x 3m single storey  flat roof rear extension with parapet wall to rear. Remove existing kitchen and create new open plan living area with window and bi-folds to rear, 3 roof lights to new flat roof. Reduce size of WC and plumb in new sanitary ware. Insulate existing wall as shown. Move SVP.

NB: No additional works are undertaken to existing walls or floors apart from making good. BCO may require these to be upgraded depending on condition.

Structure: Built following the highest standards conforming with the latest building regulations to include structural beams, joists & rafters, foundations created to 1.250mm x 600mm depth and width*, with block and beam flooring, block brick-built walls with full insulation throughout.
`;

const DEFAULT_EXTRA_COSTS = `
Required
Cost of building inspector - £985+vat
Asbestos Survey - £300+vat

Optional
Move boiler – approx. £1500-£2,000+vat dependent on location and new boiler flue.
Move manhole to new location - Full assessment needed, normally approx. £1500+vat per connection, £600+vat per further connection
Drain survey - will be needed if uncertainty of sewer/drain location and how this will affect foundations of the new extension. £400 +vat for full camera survey and report. (1 hour survey)
Drawings & application - process for drainage works £125+vat
Thames water application fee - £299.00
Soakaway – Under building regulations section H, a soak away for surface water is now required budget £1350+vat
Aco drain – if required £150 per metre.
Seedun Roof – Dependent on spec & flat roof finish – budget £2-£4,000+vat
Tiling – on average £100+vat per square meter for labour, adhesive, grout and trims.
Lay flooring - on average £60+vat per square meter dependent on final tiles (labour only)
Decorating – Budget £800-£1,00 per room, includes preparing walls, skirting and architrave and painting in 1 colour, 2 coats.
Under floor heating – Water fed budget £150m2 to supply and fit to newly created area. This is based on a system that is fitted directly over the existing and new floor and applying a screed finish.

`;

const DEFAULT_PRICING_TEXT = `This price is based on material and labour costs at the time of the estimate, using up to date price lists, which are generally stable barring major crises. During the build-ready process there’s usually a gap between contract signing and the start date. Our aim to begin projects promptly, delays beyond our control can happen, affecting start times and costs. If material or labour prices increase due to inflation or other external factors, we ask for flexibility and fairness in addressing these changes. We will always justify any necessary price adjustments, and if costs decrease, adjust prices to ensure fairness.

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

This is very much born out of a ‘can do’ attitude we choose to have, resulting in many varied styles and finishes we achieve in the extensions we carry out. Our work, therefore, reflects a more considered approach, which may indeed stray from the plan. Our concern is not how quickly we can finish and move on to the next project without interruption, but to build with your involvement. This might take a little longer! As long as it is structurally viable, we are happy to talk through changes/ideas you may have and carry out the works accordingly.
`;

const DEFAULT_BRIEF_TEXT = `Thank you again for the opportunity to quote for your build. This quotation is based on our recent discussions regarding the proposed extension to your home.

The following outlines what is included within our quotation, along with a separate section covering required items such as Building Control and asbestos surveys, as well as potential extras like tiling or a new boiler.

Any additional works are managed through our formal change order process, overseen by your dedicated Project Manager. This ensures full transparency, with no additional costs incurred without your prior approval.

We have also attached a brochure, which provides a more in-depth explanation of our delivery, standards, and processes.

As members of the Federation of Master Builders, with Chartered CIOB Directors and working under JCT contracts, we operate to the highest industry standards, giving you confidence in both the quality of our work and the way your project is managed from start to finish.`;

const DEFAULT_TERMS_AND_CONDITIONS = `
The following expressions shall have the following meanings:
1.1 “Supplier” means NORTH LONDON LOFT ROOMS LTD Archers Fields, Basildon, Essex SS13 1DN.
1.2 “Customer” means any person who purchases Services and/or Products from the Supplier;
1.3 “Proposal” means a statement of work, quotation or other similar document describing the Services and/or the Products;
1.4 “Services” means the services as described in the Proposal and includes any materials required to complete the work;
1.5 “Products” means any products supplied by the Supplier to the Customer;
1.6 “Terms and Conditions” means the terms and conditions of supply of Services and/or Products set out in this document and any subsequent terms and conditions agreed in writing by the Supplier;
1.7 “Order” means the formal acceptance by the Customer of the Proposal;
1.8 “Agreement” means the contract between the Supplier and the Customer for the provision of the Services and/or Products incorporating these Terms and Conditions;
1.9 “Intellectual Property Rights” means any patent, trademark, service mark, registered design, copyright, design right, right to extract or exploit information from a database, database rights, know-how, confidential information or process, any application for any of the above, and any other Intellectual Property Right recognised in any part of the world whether or not presently existing or applied for;
1.10 “Adjudicator” is the party nominated to resolve a dispute between the Customer and the Supplier as stipulated in the contract between them.
2 GENERAL
2.1 These Terms and Conditions shall apply to the Agreement for the supply of Services and/or Products by the Supplier to the Customer and shall supersede any other documentation or communication between the Supplier and the Customer.
2.2 Any variation to these Terms and Conditions must be agreed in writing by the Supplier.
2.3 Nothing in these Terms and Conditions shall prejudice any condition or warranty, express or implied, or any legal remedy to which the Supplier may be entitled in relation to the Services and/or Products, by virtue of any statute, law or regulation.
3 PROPOSAL
3.1 The Proposal for Services and/or Products is attached to these Terms and Conditions, and/or are available for inspection on www.northlondonlofts.co.uk. By accessing your builder trend account and signing your contract you confirm your agreement to be bound by these terms and conditions.
3.2 The Proposal for Services and/or Products shall remain valid for a period of 28 days.
3.3 The Proposal must be accepted by the Customer in its entirety.
3.4 The Customer shall be deemed to have accepted the Proposal by placing an Order with the Supplier.
3.5 The Agreement between the Supplier and the Customer, incorporating these Terms and Conditions, shall only come into force when the Supplier confirms an Order in writing to the Customer. Prior to any confirmation the Supplier has the right to refuse any Order.
4 SERVICES, PRODUCTS AND DELIVERY
4.1 The Services and/or Products are as described in the Proposal.
4.2 Any variation to the Services and/or Products must be agreed by the Supplier in writing.
4.3 Any drawings, descriptions or specifications contained in advertising material, brochures or catalogues issued by the Supplier are for the sole purpose of giving an approximate idea of the Products and/or Services and will not form part of any Agreement unless otherwise agreed in writing by the Supplier.
4.4 The Services and/or Products will be delivered between the hours of 08:00 and 18:00 Monday to Friday. The Supplier may vary these times by intimating in writing details of the change to the Customer.
4.5 Dates given for the delivery of Services and/or Products are estimates only and not guaranteed. Time for delivery shall not be of the essence of the Agreement and the Supplier shall not be held liable for any loss, costs, damages, charges, or expenses caused directly or indirectly by any delay in the delivery. Due to the nature of our work and supplier’s difficulties sourcing materials etc this shall not be taken off our timeline for the works. 
5 PRICE AND PAYMENT
5.1 The price for Services and/or Products is as specified in the Proposal and is inclusive of VAT and any other charges as outlined in the Proposal.
5.2 The price for any materials required to complete the Services is inclusive in the Proposal.
5.3 The terms for payment are as specified in the Proposal/contract.
5.4 The Customer must settle all payments for Services and/or Products from the invoice date.
5.5 The Customer will pay interest on all late payments at a rate of 10% per annum above the base lending rate of Barclays Bank Plc.
5.6 The Supplier is also entitled to recover all reasonable expenses incurred in obtaining payment from the Customer where any payment due to the Supplier is late.
5.7 The Customer is not entitled to withhold any monies due to the Supplier.
5.8 The Supplier is entitled to vary the price to take account of:
5.8.1 any additional Services and/or Products requested by the Customer which were not included in the original Proposal;
5.8.2 any increase in the cost of materials;
5.8.3 any additional work required to complete the Services which was not anticipated at the time of the Proposal;
and any variation must be intimated to the Customer in writing by the Supplier.
6 CUSTOMER OBLIGATIONS
6.1 The Customer will provide access to the Supplier at the times specified in these Terms and Conditions and will co-operate with all reasonable requests by the Supplier.
6.2 The Customer will provide electricity, water and toilet facilities to the Supplier for the purpose of completing the Services.
6.3 The Customer will apply for, obtain and meet the cost of all necessary approvals and permissions required to complete the Services prior to the commencement of the work.
6.4 The Customer will take all reasonable steps to ensure that the Supplier does not sustain any damage or loss to any equipment stored on site.
6.5 The Customer shall be liable for any expenses incurred by the Supplier as a result of the Customers failure to comply with the obligations as defined by these Terms and Conditions.
7 SUPPLIER OBLIGATIONS
7.1 The Supplier shall supply the Services and/or Products as specified in the Proposal.
7.2 The Supplier shall perform the Services with reasonable skill and care and to a reasonable standard and in accordance with recognised codes of practice.
7.3 The Supplier shall comply with all relevant health and safety regulations.
7.4 The Supplier shall be registered with the appropriate organisation for the purpose of self-certification or notify building control to arrange for an inspection of the work carried out if so required to do so in terms of the relevant building regulations.
7.5 In addition to the undertakings specified in Clause 7.4 the Supplier shall ensure that all necessary licences and permissions required to provide the Services and/or Products are current.
7.6 The Supplier shall be responsible for all waste management and disposal required in the course of providing the Services and/or Products.
7.7 The Supplier shall hold valid employer and public liability insurance policies.
8 CANCELLATION
8.1 The Customer may cancel an Order for Services and/or Products by notifying the Supplier in writing within 14 days of placing the Order and any monies paid by the Customer will be refunded in full subject to the deduction of an administration charge of £1,500.00 or as determined by the Supplier (NB no works can start before this period)
8.2 If the Customer does not notify any cancellation within the time specified in Clause 8.1 any monies paid will not be refundable.
9 INSPECTION OF PRODUCTS AND SERVICES 
9.1 The Customer shall inspect the Products delivered to site and accepted by NLLR Staff on delivery and notify the Supplier of any damaged, missing or defective items or work within 24 hours from the date of delivery.
9.2 The Customer shall inspect the services delivered by NLLR anytime during the contracted agreement and warranty. And notify the project management team of any problems.
10 DEFECTIVE PRODUCTS AND SERVICES 
10.1 The Supplier guarantees the structure under our 10 year warranty. Products supplied by NLLR suppliers will provide their own guarantess.
10.2 Clause 10.1 does not apply:
10.2.1 if a fault arises due to any subsequent mechanical, chemical, electrolytic or other damage not due to a defect in the Services and/or Products after risk has passed to the Customer;
10.2.2 if a fault arises due to willful damage, abnormal working conditions, failure to follow instructions, misuse, alteration or unauthorised repair, improper maintenance or negligence on the part of the Customer or a third party.
10.3 If the Services and/or Products are found to be defective in accordance with these Terms and Conditions then the Supplier shall, at its sole discretion, either repair, re-perform or replace the Services and/or Products or refund any monies paid for the defective Services and/or Products.
10.4 If the Customer has not paid for the Services and/or Products in full by the date the defect in Services and/or Products is notified to the Supplier then the Supplier has no obligation to remedy the defect in terms of this Clause10.
11 PROPERTY AND RISK
11.1 Risk in the Products or in any property or materials used to provide the Services shall pass from the Supplier to the Customer when the Products or property or materials leave the premises of the Supplier or on delivery if the Supplier is transporting the items.
11.2 Adequate insurance should be held by both parties to protect the Products or any property or materials that are within their care.
11.3 Title or ownership of any property or materials belonging to the Supplier remains with the Supplier until payment is received from the Customer in full.
11.4 The Customer must store any property or materials belonging to the Supplier separately from any other property or materials belonging to the Customer or a third party.
12 TERMINATION
12.1 The Agreement shall continue until the Services and/or Products have been provided in terms of the Proposal or any subsequent date as mutually agreed in writing by both parties or until terminated by either party in accordance with these Terms and Conditions.
12.2 The Customer may terminate the Agreement if the Supplier fails to comply with any aspect of these Terms and Conditions and this failure continues for a period of 7 days after notification of non-compliance is given.
12.3 The Supplier may terminate the Agreement if the Customer has failed to make over any payment due of the sum being requested.
12.4 Either party may terminate the Agreement by notice in writing to the other if:
12.4.1 the other party commits a material breach of these Terms and Conditions and, in the case of a breach capable of being remedied, fails to remedy it within a reasonable time of being given written notice from the other party to do so; or
12.4.2 the other party commits a material breach of these Terms and Conditions which cannot be remedied under any circumstances; or
12.4.3 the other party passes a resolution for winding up (other than for the purpose of solvent amalgamation or reconstruction), or a court of competent jurisdiction makes an order to that effect; or
12.4.4 the other party ceases to carry on its business or substantially the whole of its business; or
12.4.5 the other party is declared insolvent, or convenes a meeting of or makes or proposes to make any arrangement or composition with its creditors; or a liquidator, receiver, administrative receiver, manager, trustee or similar officer is appointed over any of its assets.
12.5 In the event of termination the Customer must make over to the Supplier any payment for work done and expenses incurred up to the date of termination.
12.6 Any rights to terminate the Agreement shall be without prejudice to any other accrued rights and liabilities of the parties arising in any way out of the Agreement as at the date of termination.
13 WARRANTIES
13.1 The Supplier warrants that the Products will, at the time of delivery, correspond to the description given in the Proposal.
13.2 The Supplier warrants that the Services will be performed using all reasonable skill and care.
14 LIMITATION OF LIABILITY
14.1 Nothing in these Terms and Conditions shall exclude or limit the liability of the Supplier for death or personal injury, however the Supplier shall not be liable for any direct loss or damage suffered by the Customer howsoever caused, as a result of any negligence, breach of contract or otherwise in excess of the price of the Service and/or the Products.
14.2 The Supplier shall not be liable under any circumstances to the Customer or any third party for any indirect or consequential loss of profit, consequential or other economic loss suffered by the Customer howsoever caused, as a result of any negligence, breach of contract, misrepresentation or otherwise.
14.3 For the avoidance of doubt, time shall not be of the essence and the Supplier shall incur no liability to the Customer in respect of any failure to complete the Services or supply the Products by any agreed completion date.
15 INDEMNITY
15.1 The Customer shall indemnify the Supplier against all claims, costs and expenses which the Supplier may incur and which arise directly or indirectly from the Customer’s breach of any of its obligations under these Terms and Conditions.
16 SETTLEMENT OF DISPUTES
16.1 Any dispute arising under this Agreement will be referred to and decided by the Adjudicator.
16.2 The Adjudicator will be appointed by application to one of the adjudicators listed in the contract.
16.3 A party wishing to refer a dispute to the Adjudicator shall advise the other party of this intention in writing at any time during the term of this Agreement. The dispute must then be referred to the Adjudicator within seven 7 days of this intention being intimated.
16.4 The Adjudicator shall act impartially and be free to take the initiative in ascertaining the facts and the law. The Adjudicator must reach a decision within twenty eight (28) days of referral or such longer period as the parties may agree.
16.5 During the period of adjudication both parties must continue with their obligations as stated in this Agreement.
16.6 The decision of the Adjudicator is binding on both parties unless and until revised by legal proceedings, arbitration or agreement.
16.7 The Adjudicator will decide which party is liable to meet the fees of the adjudication and in what proportion if both parties are held liable.
17 INTELLECTUAL PROPERTY RIGHTS
All intellectual property rights, registered or unregistered, including but not limited to patents, trademarks, design rights and know-how remain the property of the Supplier and cannot be used by the Customer without the written permission of the Supplier.
18 FORCE MAJEURE
Neither party shall be liable for any delay or failure to perform any of its obligations if the delay or failure results from events or circumstances outside its reasonable control, including but not limited to acts of God, strikes, lock outs, accidents, war, fire, breakdown of plant or machinery or shortage or unavailability of raw materials from a natural source of supply, and the party shall be entitled to a reasonable extension of its obligations.
19 RELATIONSHIP OF PARTIES
Nothing in the Agreement shall be construed as establishing or implying a partnership or joint venture between the parties or suggest that either of the parties are agent for the other.
20 ASSIGNMENT
The Customer shall not be entitled to assign its rights or obligations or delegate its duties under the Agreement without the prior written consent of the Supplier.
21 SEVERANCE
If any term or provision of these Terms and Conditions is held invalid, illegal or unenforceable for any reason by any court of competent jurisdiction such provision shall be severed and the remainder of the provisions hereof shall continue in full force and effect as if these Terms and Conditions had been agreed with the invalid, illegal or unenforceable provision eliminated.
22 WAIVER
The failure by either party to enforce at any time or for any period any one or more of the Terms and Conditions herein shall not be a waiver of them or of the right at any time subsequently to enforce all Terms and Conditions.
23 NOTICES
Any notice to be given by either party to the other may be served by email, personal service or by post to the address of the other party given in the Proposal or such other address as such party may from time to time have communicated to the other in writing, and if sent by email shall unless the contrary is proved be deemed to be received on the day it was sent. If given by letter shall be deemed to have been served at the time at which the letter was delivered personally or if sent by post shall be deemed to have been delivered in the ordinary course of post.
24 THIRD PARTY RIGHTS
Nothing in these Terms and Conditions intend to or confer any rights on a third party.
25 ENTIRE AGREEMENT
These Terms and Conditions supersede any previous agreements, arrangements, documents or other undertakings either written or oral.
26 GOVERNING LAW
These Terms and Conditions shall be governed by and construed in accordance with the law of England and the parties hereby submit to the exclusive jurisdiction of the English Courts.
`;

function SortableSection({ section, children }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div className="relative" style={style}>
      {/* Absolute-positioned handle sits left of the card so it doesn't affect alignment */}
      <div className="absolute -left-6 top-2">
        <div
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          className="cursor-grab text-gray-400 hover:text-black p-1"
          aria-label={`Drag ${section.name}`}
        >
          <GripVertical size={20} />
        </div>
      </div>

      <div className="pl-0">
        {children}
      </div>

    </div>
  );
}


export default function QuotationApp() {
  const [role, setRole] = useState<UserRole | null>(null);
  // preview UI disabled
  const [filterFromDate, setFilterFromDate] = useState<string>("");
  const [filterToDate, setFilterToDate] = useState<string>("");


  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);
  const [activeQuote, setActiveQuote] = useState<SavedQuote | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedSections = localStorage.getItem("quotationSections");
    const savedProducts = localStorage.getItem("quotationProducts");
    const savedVat = localStorage.getItem("vatRate");

    
    if (savedSections) setSections(JSON.parse(savedSections));
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedVat) setVatRate(parseFloat(savedVat));
  }, []);
  useEffect(() => {
    const saved = localStorage.getItem("savedQuotes");
    if (saved) {
      setSavedQuotes(JSON.parse(saved));
    }
  }, []);
useEffect(() => {
  localStorage.setItem("savedQuotes", JSON.stringify(savedQuotes));
}, [savedQuotes]);

//------------------------------------------------------------

  //const handleRoleSelect = (selectedRole: UserRole) => {
  //  setRole(selectedRole);
  //};

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemValueChange = (itemId: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId ? { ...item, value } : item
      )
    }));
  };

  const handleItemQuantityChange = (itemId: string, quantity: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    }));
  };

  const handleAddItem = (productId: string) => {
    const newItem: QuotationItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId,
      value: 1, // Default value
      quantity: 1, // Default quantity
      showQuantity: true,
    };
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const handleAddProduct = () => {
    if (!newProduct.name || (!newProduct.isCustomPricing && newProduct.price < 0)) return;
    
    const product: Product = {
      ...newProduct,
      id: `p${Date.now()}`,
      customPrices: newProduct.isCustomPricing 
        ? newProduct.customPrices?.filter(tier => tier.value >= 0 && tier.price >= 0)
        : undefined
    };
    
    setProducts(prev => [...prev, product]);
    setNewProduct({ 
      name: "", 
      description: "",
      section: sections[0]?.id ?? "", 
      baseCost: 0,
      supplier: "",
      markupPercent: 0,
      price: 0,
      valueType: "unit",
      isCustomPricing: false,
      customPrices: [{ value: 0, price: 0 }]
    });
  };
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );
  const handleEditProduct = (product: Product) => {
    // Ensure admin panels are visible and the target section is open
    setSectionsExpanded(true);
    setManageSectionsExpanded(true);
    setProductFormExpanded(true);
    setOpenSections(prev => prev.includes(product.section) ? prev : [...prev, product.section]);

    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description,
      section: product.section,
      baseCost: product.baseCost,
      supplier: product.supplier,
      markupPercent: product.markupPercent,
      price: product.price,
      valueType: product.valueType,
      isCustomPricing: product.isCustomPricing ?? false,
      customPrices: product.customPrices ? [...product.customPrices] : [{ value: 0, price: 0 }]
    });
  };

  const handleUpdateProduct = () => {
    if (!editingProduct) return;
    
    setProducts(prev => 
      prev.map(p => {
        if (p.id === editingProduct.id) {
          const updatedProduct = {
            ...p,
            name: newProduct.name,
            description: newProduct.description,
            section: newProduct.section,
            baseCost: newProduct.baseCost,
            supplier: newProduct.supplier,
            markupPercent: newProduct.markupPercent,
            price: newProduct.price,
            valueType: newProduct.valueType,
            isCustomPricing: newProduct.isCustomPricing,
            customPrices: newProduct.isCustomPricing 
              ? newProduct.customPrices?.filter(tier => tier.value >= 0 && tier.price >= 0)
              : undefined
          };
          return updatedProduct;
        }
        return p;
      })
    );
    
    setEditingProduct(null);
    setNewProduct({ 
      name: "", 
      description: "",
      section: sections[0]?.id ?? "", 
      baseCost: 0,
      supplier: "",
      markupPercent: 0,
      price: 0,
      valueType: "unit",
      isCustomPricing: false,
      customPrices: [{ value: 0, price: 0 }]
    });
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    // Also remove any items referencing this product
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.productId !== id)
    }));
  };

  const handleAddSection = () => {
    if (!newSectionName.trim()) return;
    
    const newSection: Section = {
      id: `s${Date.now()}`,
      name: newSectionName.trim()
    };
    
    setSections(prev => [...prev, newSection]);
    setNewSectionName("");
  };

  const handleEditSection = (section: Section) => {
    setEditingSection(section);
    setSectionToEditName(section.name);
  };

  const handleUpdateSection = () => {
    if (!editingSection || !sectionToEditName.trim()) return;
    
    setSections(prev => 
      prev.map(s => 
        s.id === editingSection.id 
          ? { ...s, name: sectionToEditName.trim() } 
          : s
      )
    );
    
    setEditingSection(null);
    setSectionToEditName("");
  };

  const handleDeleteSection = (id: string) => {
    // Don't delete if section has products
    const hasProducts = products.some(p => p.section === id);
    if (hasProducts) {
      alert("Cannot delete section with products. Please delete products first.");
      return;
    }
    
    setSections(prev => prev.filter(s => s.id !== id));
  };



  // New calculation logic
  const calculateItemTotal = (item: QuotationItem) => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return 0;
    
    if (product.isCustomPricing && product.customPrices) {
      // Find the best price tier
      const applicableTier = [...product.customPrices]
        .sort((a, b) => b.value - a.value)
        .find(tier => item.value >= tier.value);
      
      // For custom pricing, multiply the tier price by quantity
      return (applicableTier ? applicableTier.price : 0) * item.value * item.quantity;
    } else {
      // Linear pricing: price per unit/value * value * quantity
      return product.price * item.value * item.quantity;
    }
  };

  const gbpFormatter = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const calculateProductsTotal = () => {
    return formData.items.reduce((total, item) => {
      return total + calculateItemTotal(item);
    }, 0);
  };

  const calculateProductsVAT = () => {
    return (calculateProductsTotal() * vatRate) / 100;
  };

  const calculateProductsTotalWithVAT = () => {
    return calculateProductsTotal() + calculateProductsVAT();
  };
  const calculateCommissionA = () => {
    return (calculateProductsTotalWithVAT() * CommissionA) / 100;
  };

  const calculateCommissionB = () => {
    return (calculateProductsTotalWithVAT() * CommissionB) / 100;
  };

  const calculateCommissionC = () => {
    return (calculateProductsTotalWithVAT() * CommissionC) / 100;
  };

  const calculateTotalCommission = () => {
    return (calculateCommissionA() + calculateCommissionB() + calculateCommissionC());
  };

  const calculateCommissionVAT = () => {
    return (calculateTotalCommission() * vatRate) / 100;
  };


  const calculateTotalCost = () => {
    return calculateProductsTotal() + calculateTotalCommission();
  };

  const calculateTotalVAT = () => {
    return calculateProductsVAT() + calculateCommissionVAT();
  };

  const calculateGrandTotal = () => {
    return calculateTotalCost() + calculateTotalVAT();
  };

  const filteredQuotes = savedQuotes.filter(quote => {
    const quoteDate = new Date(quote.createdAt).setHours(0, 0, 0, 0);

    const fromDate = filterFromDate
      ? new Date(filterFromDate).setHours(0, 0, 0, 0)
      : null;

    const toDate = filterToDate
      ? new Date(filterToDate).setHours(23, 59, 59, 999)
      : null;

    if (fromDate && quoteDate < fromDate) return false;
    if (toDate && quoteDate > toDate) return false;

    return true;
  });


const saveQuote = () => {
  if (!formData.name.trim()) {
    alert("Please enter customer name");
    return;
  }

  // ----- UPDATE EXISTING QUOTE -----
  if (activeQuote) {
    const updatedQuote: SavedQuote = {
      ...activeQuote,
      revision: (activeQuote.revision ?? 1) + 1,
      updatedAt: new Date().toISOString(),
      title: `${formData.name} - Rev ${activeQuote.revision + 1}`,
      formData: { ...formData }
    };

    setSavedQuotes(prev =>
      prev.map(q => (q.id === activeQuote.id ? updatedQuote : q))
    );

    setActiveQuote(updatedQuote);
    alert(`Quote updated (Revision ${updatedQuote.revision})`);
    return;
  }

  // ----- CREATE NEW QUOTE -----
  const newQuote: SavedQuote = {
    id: `quote-${Date.now()}`,
    customerName: formData.name,
    title: `${formData.name} - Rev 1`,
    revision: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    formData: { ...formData }
  };

  setSavedQuotes(prev => [...prev, newQuote]);
  setActiveQuote(newQuote);

  alert("Quote saved (Revision 1)");
};



  const loadQuote = (quote: SavedQuote) => {
    setFormData(quote.formData);
    setActiveQuote(quote);
  };

  const deleteQuote = (id: string) => {
    if (confirm("Are you sure you want to delete this quote?")) {
      setSavedQuotes(prev => prev.filter(quote => quote.id !== id));
      if (activeQuote?.id === id) {
        setActiveQuote(null);
        // Reset form
        setFormData({
          name: "",
          address: "",
          items: []
        });
      }
    }
  };


  const [logos, setLogos] = useState<{
    id: string, 
    name: string, 
    src: string,
    x: number,
    y: number,
    width: number,
    height: number
  }[]>([]);
  const [logosLoading, setLogosLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Seed default logo from public/nllr_logo.png if none present
  useEffect(() => {
    let cancelled = false;
    async function seedDefaultLogo() {
      if (logos.length > 0) return; // don't overwrite existing uploads
      setLogosLoading(true);
      try {
        const res = await fetch('/nllr_logo.png');
        if (!res.ok) throw new Error('Failed to fetch default logo');
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onload = () => {
          if (cancelled) return;
          const dataUrl = reader.result as string;
          const seeded = {
            id: `logo-seed-1`,
            name: 'nllr_logo.png',
            src: dataUrl,
            x: 15,
            y: 15,
            width: 60,
            height: 30,
          };
          setLogos([seeded]);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        // ignore fetch errors; leave logos empty
        console.warn('Could not seed default logo:', err);
      } finally {
        if (!cancelled) setLogosLoading(false);
      }
    }
    seedDefaultLogo();
    return () => { cancelled = true; };
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newLogo = {
            id: `logo-${Date.now()}-${Math.random()}`,
            name: file.name,
            src: event.target.result as string,
            x: 15, // Default position
            y: 15,
            width: 60, // Default size
            height: 30
          };
          setLogos(prev => [...prev, newLogo]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeLogo = (id: string) => {
    setLogos(prev => prev.filter(logo => logo.id !== id));
  };


  const updateLogoPosition = (id: string, x: number, y: number) => {
    setLogos(prev => prev.map(logo => 
      logo.id === id ? { ...logo, x, y } : logo
    ));
  };

  const updateLogoSize = (id: string, width: number, height: number) => {
    setLogos(prev => prev.map(logo => 
      logo.id === id ? { ...logo, width, height } : logo
    ));
  };
//--------------------------------------------------Image
  const [images, setImages] = useState<{
    id: string, 
    name: string, 
    src: string,
    x: number,
    y: number,
    width: number,
    height: number
  }[]>([]);
  const fileInputRef1 = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files1 = e.target.files;
    if (!files1) return;
    
    Array.from(files1).forEach(file => {
      const reader1 = new FileReader();
      reader1.onload = (event) => {
        if (event.target?.result) {
          const newImage = {
            id: `image-${Date.now()}-${Math.random()}`,
            name: file.name,
            src: event.target.result as string,
            x: 15, // Default position
            y: 110,
            width: 180, // Default size
            height: 100
          };
          setImages(prev => [...prev, newImage]);
        }
      };
      reader1.readAsDataURL(file);
    });
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(image => image.id !== id));
  };


  const updateImagePosition = (id: string, x: number, y: number) => {
    setImages(prev => prev.map(image => 
      image.id === id ? { ...image, x, y } : image
    ));
  };

  const updateImageSize = (id: string, width: number, height: number) => {
    setImages(prev => prev.map(image => 
      image.id === id ? { ...image, width, height } : image
    ));
  };





  const [sections, setSections] = useState<Section[]>(initialSections);


  const [products, setProducts] = useState<Product[]>(initialProducts);

  const [openSections, setOpenSections] = useState<string[]>([]);

  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setSections((items) => {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }
  function toggleSection(id: string) {
    setOpenSections(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  }


  const [formData, setFormData] = useState<QuotationFormData>({
    name: "",
    address: "",
    items: [],
  });
  const {attributes, listeners, setNodeRef, transform, transition} = useSortable({id: "sections"}); 
  const [newProduct, setNewProduct] = useState<Omit<Product, "id"> & { isCustomPricing?: boolean; customPrices?: { value: number; price: number }[] }>({ 
    name: "", 
    description: "",
    section: sections[0]?.id ?? "", 
    baseCost: 0,
    supplier: "",
    markupPercent: 0,
    price: 0,
    valueType: "unit",
    isCustomPricing: false,
    customPrices: [{ value: 0, price: 0 }]
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const productFormRef = useRef<HTMLDivElement | null>(null);
  const [newSectionName, setNewSectionName] = useState("");
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sectionToEditName, setSectionToEditName] = useState("");
  const editRowRef = useRef<HTMLDivElement | null>(null);
  const sectionsCardRef = useRef<HTMLDivElement | null>(null);
  // Collapse/expand parent for sections list in admin UI
  const [sectionsExpanded, setSectionsExpanded] = useState<boolean>(false);
  // Collapse/expand parent for the bottom text sections (brief, extra costs, pricing, terms)
  const [textSectionsExpanded, setTextSectionsExpanded] = useState<boolean>(false);
  // Additional collapsible admin panels
  const [commissionExpanded, setCommissionExpanded] = useState<boolean>(false);
  const [manageSectionsExpanded, setManageSectionsExpanded] = useState<boolean>(false);
  const [productFormExpanded, setProductFormExpanded] = useState<boolean>(false);
  const [dataMigrationExpanded, setDataMigrationExpanded] = useState<boolean>(false);
  const [logosExpanded, setLogosExpanded] = useState<boolean>(false);
  const [selectProductsExpanded, setSelectProductsExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (editingSection && sectionsCardRef.current) {
      // Compute document position of the sections card and scroll so its top aligns to the viewport top
      const rect = sectionsCardRef.current.getBoundingClientRect();
      const docTop = window.pageYOffset || document.documentElement.scrollTop;
      let target = rect.top + docTop;

      // Try to account for a fixed header: look for common header selectors
      const header = document.querySelector('header') || document.querySelector('[role="banner"]') || document.querySelector('.fixed');
      const headerHeight = header ? (header as HTMLElement).getBoundingClientRect().height : 0;
      if (headerHeight) target = Math.max(0, target - headerHeight - 8);

      // initial scroll
      window.scrollTo({ top: target, behavior: 'smooth' });

      // second pass after layout settles (handles async DOM shifts)
      setTimeout(() => {
        if (sectionsCardRef.current) {
          sectionsCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          const input = document.querySelector('#sectionName') as HTMLInputElement | null;
          if (input) input.focus();
        }
      }, 350);
    }
  }, [editingSection]);

  // When editingProduct is set, scroll the Add New Product card into view and focus the product name input
  useEffect(() => {
    if (editingProduct && productFormRef.current) {
      // Compute document position of the product card and scroll so its top aligns to viewport top
      const rect = productFormRef.current.getBoundingClientRect();
      const docTop = window.pageYOffset || document.documentElement.scrollTop;
      let target = rect.top + docTop;

      // Try to account for a fixed header: look for common header selectors
      const header = document.querySelector('header') || document.querySelector('[role="banner"]') || document.querySelector('.fixed');
      const headerHeight = header ? (header as HTMLElement).getBoundingClientRect().height : 0;
      if (headerHeight) target = Math.max(0, target - headerHeight - 8); // small gap

      // initial scroll
      window.scrollTo({ top: target, behavior: 'smooth' });

      // second pass after layout settles (handles async accordion/DOM shifts)
      setTimeout(() => {
        if (productFormRef.current) {
          productFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          const input = productFormRef.current.querySelector('#productName') as HTMLInputElement | null;
          if (input) input.focus();
        }
      }, 350);
    }
  }, [editingProduct]);

  //---------------------------------
  //---------------------------------
  //---------------------------------
  //-------COMMISSION EDITS----------
  //---------------------------------
  //---------------------------------
  //---------------------------------

 // keep using your existing VAT state

  const [vatRate, setVatRate] = useState(20); // 20% default
  const [CommissionA, setCommissionA] = useState(0.5); // 0.5% default
  const [CommissionB, setCommissionB] = useState(1.0); // 1.0% default
  const [CommissionC, setCommissionC] = useState(2.5); // 2.5% default
  const [companyDescription, setCompanyDescription] = useState<string>(DEFAULT_COMPANY_DESCRIPTION.trim()); // Company intro/description for PDF
  const [extraCostsText, setExtraCostsText] = useState<string>(DEFAULT_EXTRA_COSTS.trim()); // Extra costs text for PDF
  const [briefText, setBriefText] = useState<string>(DEFAULT_BRIEF_TEXT.trim()); // Brief text for PDF
  const [pricingText, setPricingText] = useState<string>(DEFAULT_PRICING_TEXT.trim()); // Pricing text for PDF
  const [termsAndConditions, setTermsAndConditions] = useState<string>(DEFAULT_TERMS_AND_CONDITIONS.trim()); // Terms and conditions text for PDF
  const VAT_RATE = vatRate;

  // data handling UI state
  const [dataUser] = useState('admin');
  const [dataPass, setDataPass] = useState('');

  // --- LocalStorage export/import helpers (admin-only) ---
  const exportLocalStorage = () => {
    const obj: Record<string, any> = {};
    for (const k of Object.keys(localStorage)) {
      try { obj[k] = JSON.parse(localStorage.getItem(k) ?? 'null'); }
      catch { obj[k] = localStorage.getItem(k); }
    }
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quotation-localStorage.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const importLocalStorageFile = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      Object.entries(parsed).forEach(([k, v]) => {
        localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
      });
      // Refresh to pick up new state
      window.location.reload();
    } catch (err) {
      // simple user feedback
      // eslint-disable-next-line no-console
      console.error('Failed to import localStorage file', err);
      alert('Import failed: invalid file');
    }
  };
  const importInputRef = useRef<HTMLInputElement | null>(null);





  //pdf generation function



  //------------------------------------------------------------
  //------------------------------------------------------------
  //------------------------------------------------------------
  //------------------------------------------------------------
  //-------------------WD-PDF-GENERATION------------------------
  //------------------------------------------------------------
  //------------------------------------------------------------
  //------------------------------------------------------------
  //------------------------------------------------------------
  const generatePDF1 = () => {
    const doc = new jsPDF();
    // Add logo if available
    logos.forEach(logo => {
      doc.addImage(
        logo.src,
        'PNG',
        logo.x,
        logo.y,
        logo.width,
        logo.height
      );
    });
    // Add client details
    doc.setFontSize(12);
    doc.text('Working Details PDF', 135, 23);
    const nameWidth = doc.getTextWidth(formData.name);
    const wrappedAddress = doc.splitTextToSize(formData.address, 60);
    if (nameWidth > 60) {
      const wrappedName = doc.splitTextToSize(formData.name, 60);
      doc.text(`Client: `, 135, 30);
      doc.text(wrappedName, 155, 30);
      doc.text(`Address: `, 135, 44);
      doc.text(wrappedAddress, 155, 44);
    } else {
      doc.text(`Client: ${formData.name}`, 135, 30);
      doc.text(`Address: `, 135, 37);
      doc.text(wrappedAddress, 155, 37);
    }
    // Add description section with paragraph format
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 255);
    doc.setFont("times", 'normal');
    const sectionTitle = 'SMART SOLUTIONS FOR MODERN LIVING';
    doc.text(sectionTitle, 105, 75, { align: 'center' });
    const sectionTitleWidth = doc.getTextWidth(sectionTitle);
    doc.setDrawColor(0, 0, 255);
    doc.setLineWidth(0.5);
    doc.line(45, 76, 45 + sectionTitleWidth, 76);

    // Helper: consistent line height and safe multi-line placement
    function getLineHeight(documentInstance: any, multiplier = 1.15) {
      const fontSize = typeof documentInstance.getFontSize === 'function' ? documentInstance.getFontSize() : 11;
      // jsPDF fontSize is in points; convert to mm (1pt = 0.352777778 mm)
      return fontSize * 0.352777778 * multiplier;
    }

    function placeTextLines(documentInstance: any, lines: string[] | string, x: number, yStart: number, marginBottom = 20) {
      const pageHeight = documentInstance.internal.pageSize.getHeight();
      let y = yStart;
      const effectiveLines = Array.isArray(lines) ? lines : [lines];
      const lh = getLineHeight(documentInstance);
      for (const line of effectiveLines) {
        if (y + lh > pageHeight - marginBottom) {
          documentInstance.addPage();
          y = 20; // top margin
        }
        documentInstance.text(String(line), x, y);
        y += lh;
      }
      return y;
    }



    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", 'italic');
    doc.text('The whole NLLR team were very', 20, 91,);
    doc.text('professional in their conduct.', 23, 96,);

    doc.text("I'd recommend NLLR to anybody looking for a trustworthy", 89, 91,);
    doc.text("team and a high standard of workmanship", 99, 96,);

    doc.text("Effective communication was key to our building", 15, 224,);
    doc.text("project because we were going to be out of the UK", 13, 229,);
    doc.text("while it happened, and North London Loft Rooms", 15, 234,);
    doc.text("didn't disappoint.", 37, 239,);

    doc.text("The conversion and quality finish also", 125, 224,);
    doc.text("helped the flat to stand out", 136, 229,);
    doc.text("on rightmove and enabled us to secure a", 122, 234,);
    doc.text("buyer quickly.", 143, 239,);

    doc.addPage();
    let yPos = 20;

    doc.setFont("helvetica", 'normal');
    doc.setFont("helvetica", 'bold');
    doc.setFontSize(16);
    doc.text('Itemized:', 20, yPos + 15);
    doc.setFontSize(12);
    doc.setFont("helvetica", 'normal');
    yPos += 25;
    formData.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return;
      const itemTotal = calculateItemTotal(item);
      const itemDesc = `${item.quantity} x ${item.value}${product.valueType === "unit" ? "" : product.valueType === "meter" ? "m" : "m²"} ${product.name}`;
      const baseCostText = product.baseCost > 0 ? ` (Base Cost: £${product.baseCost.toFixed(2)})` : " (Base Cost: NA)";
      const supplierText = product.supplier ? ` (Supplier: ${product.supplier})` : "(Supplier: NA)";
      const markupText = product.baseCost > 0 ? ` (Markup: ${product.markupPercent.toFixed(2)}%)` : " (Markup: NA)";

      const pageHeight = doc.internal.pageSize.getHeight();
      const bottomMargin = 20;
      const lh = getLineHeight(doc);
      if (yPos + lh > pageHeight - bottomMargin) {
        doc.addPage();
        yPos = 20;
      }

      doc.text(itemDesc, 20, yPos);
      doc.text(`£${itemTotal.toFixed(2)}`, 180, yPos, { align: 'right' });
      yPos += lh;

      const descriptionLines = doc.splitTextToSize(product.description, 100);
      yPos = placeTextLines(doc, descriptionLines, 25, yPos, bottomMargin);

      // small gap after description
      yPos += lh * 0.4;

      doc.text(baseCostText, 25, yPos);
      doc.text(markupText, 100, yPos);
      yPos += lh;
      doc.text(supplierText, 25, yPos);
      yPos += lh * 1.2;
    });

    doc.addPage();
    doc.setFont("helvetica", 'normal');
    doc.setFont("helvetica", 'bold');
    doc.setFontSize(16);
    doc.text('Details of Project:', 20, 20);
    doc.setFontSize(12);
    yPos = 30;
    doc.setFont("helvetica", 'normal');
    doc.text('Products Total:', 20, yPos);
    doc.text(`£${calculateProductsTotal().toFixed(2)}`, 150, yPos, { align: 'right' });
    yPos += 7;
    doc.text('VAT (20%):', 20, yPos);
    doc.text(`£${calculateProductsVAT().toFixed(2)}`, 150, yPos, { align: 'right' });
    yPos += 7;
    doc.text('Products + VAT:', 20, yPos);
    doc.text(`£${calculateProductsTotalWithVAT().toFixed(2)}`, 150, yPos, { align: 'right' });
    yPos += 7;
    doc.text('Marketing:', 20, yPos);
    doc.text(`£${calculateCommissionA().toFixed(2)}`, 150, yPos, { align: 'right' });
    yPos += 7;
    doc.text('Admin:', 20, yPos);
    doc.text(`£${calculateCommissionB().toFixed(2)}`, 150, yPos, { align: 'right' });
    yPos += 7;
    doc.text('Commission:', 20, yPos);
    doc.text(`£${calculateCommissionC().toFixed(2)}`, 150, yPos, { align: 'right' });
    yPos += 7;
    doc.text('Total Commission:', 20, yPos);
    doc.text(`£${calculateTotalCommission().toFixed(2)}`, 150, yPos, { align: 'right' });
    yPos += 7;
    doc.text('VAT on Commission (20%):', 20, yPos);
    doc.text(`£${calculateCommissionVAT().toFixed(2)}`, 150, yPos, { align: 'right' });
    yPos += 7;
    doc.setFont("helvetica", 'bold');
    doc.text('Total Cost (Products + Commission):', 20, yPos);
    doc.text(`£${calculateTotalCost().toFixed(2)}`, 150, yPos, { align: 'right' });
    yPos += 7;
    doc.text('Total VAT:', 20, yPos);
    doc.text(`£${calculateTotalVAT().toFixed(2)}`, 150, yPos, { align: 'right' });
    yPos += 7;
    doc.text('Grand Total:', 20, yPos);
    doc.text(`£${calculateGrandTotal().toFixed(2)}`, 150, yPos, { align: 'right' });

    yPos += 15;
    doc.setFont("helvetica", 'normal');
    doc.setFontSize(11);
    doc.text('On behalf of Michael Smith,', 20, yPos);
    yPos += 7;  
    doc.text('Sales Director,', 20, yPos);
    yPos += 7;
    doc.text('North London Loft Rooms', 20, yPos);


    // Save the PDF
    doc.save(`WD-quotation-${formData.name.replace(/\s+/g, "-")}.pdf`);
    
    
    return doc;

  };
  //pdf generation function
  //------------------------------------------------------------
  //------------------------------------------------------------
  //------------------------------------------------------------
  //------------------------------------------------------------
  //----------------------PDF-GENERATION------------------------
  //------------------------------------------------------------
  //------------------------------------------------------------
  //------------------------------------------------------------
  //------------------------------------------------------------
  const generatePDF = () => {
    // Group items by section for paragraph formatting
    const itemsBySection: Record<string,{ product: Product; item: QuotationItem }[]> = {};
    
    
    formData.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return;

      if (!itemsBySection[product.section]) {
        itemsBySection[product.section] = [];
      }

      itemsBySection[product.section].push({ product, item });
    });

    const subtotal = calculateTotalCost();
    const vat = calculateTotalVAT();
    const grandTotal = calculateGrandTotal();

    // Create PDF content with paragraph-style descriptions
    const doc = new jsPDF();
       // Add logo if available
    logos.forEach(logo => {
      doc.addImage(
        logo.src, 
        'PNG', 
        logo.x, 
        logo.y, 
        logo.width, 
        logo.height
      );
    });
    images.forEach(image => {
      doc.addImage(
        image.src, 
        'PNG', 
        image.x, 
        image.y, 
        image.width, 
        image.height
      );
    });

    
    // Add client details
    doc.setFontSize(12);
    // const nameWidth = doc.getTextWidth(formData.name);

    const wrappedAddress = doc.splitTextToSize(formData.address, 50);
    
    const wrappedName = doc.splitTextToSize(formData.name, 50);
    doc.text(`Client: `, 135, 30);
    doc.text(wrappedName, 155, 30);
    doc.text(`Address: `, 135, 42);
    doc.text(wrappedAddress, 155, 42);




    
    // Add description section with paragraph format
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 255);
    doc.setFont("times", 'normal');
    const sectionTitle = 'SMART SOLUTIONS FOR MODERN LIVING';
    doc.text(sectionTitle, 105, 67, { align: 'center' });
    const sectionTitleWidth = doc.getTextWidth(sectionTitle);
    doc.setDrawColor(0, 0, 255);
    doc.setLineWidth(0.5);
    doc.line(43, 68, 43 + sectionTitleWidth, 68);

    // Helper: consistent line height and safe multi-line placement
    function getLineHeight(documentInstance: any, multiplier = 1.15) {
      const fontSize = typeof documentInstance.getFontSize === 'function' ? documentInstance.getFontSize() : 11;
      return fontSize * 0.352777778 * multiplier; // pt->mm conversion * multiplier
    }

    function placeTextLines(documentInstance: any, lines: string[] | string, x: number, yStart: number, marginBottom = 20) {
      const pageHeight = documentInstance.internal.pageSize.getHeight();
      let y = yStart;
      const effectiveLines = Array.isArray(lines) ? lines : [lines];
      const lh = getLineHeight(documentInstance);
      for (const line of effectiveLines) {
        if (y + lh > pageHeight - marginBottom) {
          documentInstance.addPage();
          y = 20;
        }
        documentInstance.text(String(line), x, y);
        y += lh;
      }
      return y;
    }



    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", 'italic');
    doc.text('The whole NLLR team were very', 20, 91,);
    doc.text('professional in their conduct.', 23, 96,);

    doc.text("I'd recommend NLLR to anybody looking for a trustworthy", 89, 91,);
    doc.text("team and a high standard of workmanship", 99, 96,);

    doc.text("Effective communication was key to our building", 15, 224,);
    doc.text("project because we were going to be out of the UK", 13, 229,);
    doc.text("while it happened, and North London Loft Rooms", 15, 234,);
    doc.text("didn't disappoint.", 37, 239,);

    doc.text("The conversion and quality finish also", 125, 224,);
    doc.text("helped the flat to stand out", 136, 229,);
    doc.text("on rightmove and enabled us to secure a", 122, 234,);
    doc.text("buyer quickly.", 143, 239,);


    doc.addPage();
    doc.setFont("helvetica", 'normal');
    doc.setFont("helvetica", 'bold');
    let yPos = 20;
    doc.text('BRIEF:', 20, yPos);
    doc.setFont("helvetica", 'normal');
    const briefLines = doc.splitTextToSize(briefText, 170);
    doc.text(briefLines, 20, yPos + 7);
    yPos += briefLines.length / 2 * 8 + 20;


    doc.setFont("helvetica", 'bold');
    doc.text('DESCRIPTION OF WORK:', 20, yPos);
    

    doc.setFont("helvetica", 'normal');
    yPos += 10;


    //doc.text('Description of project:', 20, yPos);
    //yPos += 7;
    //const descriptionLines = doc.splitTextToSize(companyDescription, 170);
    //doc.text(descriptionLines, 20, yPos);
    //yPos += descriptionLines.length / 2 * 8 + 15;
    // Loop through sections and add items as paragraphs


    sections.forEach(section => {
      const sectionItems = itemsBySection[section.id];
      if (sectionItems && sectionItems.length > 0) {



        const SquareMeterage: string[] =[];
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
        const Descriptions: string[] = [];

        let SquareMeterageDesc = "";
        let SSColumnsDesc = "";
        let steelBeamsDesc = "";
        let RHSsteelDesc = "";
        let VeluxDesc = "";
        let RoofLanternDesc = "";
        let SlimglazeDesc = "";
        let whiteUPVCDesc = "";
        let greyAluminiumDesc = "";
        let glazingVisionDesc = "";
        let DescriptionsDesc = "";

        sectionItems.forEach(({ product, item }) => {
          const valueUnit = product.valueType === "unit" ? "" : product.valueType === "meter" ? "m" : "m²";

          if (product.name.toLowerCase().includes("structural support columns")) {
            SSColumns.push(`${item.value}x`);
            if (!SSColumnsDesc) SSColumnsDesc = product.description;
          } else if (product.name.toLowerCase().includes("steel beams")) {
            steelBeams.push(`${item.quantity}x${item.value}${valueUnit}`);
            if (!steelBeamsDesc) steelBeamsDesc = product.description;
          } else if (product.name.toLowerCase().includes("rhs steel")) {
            RHSsteel.push(`${item.value}x`);
            if (!RHSsteelDesc) RHSsteelDesc = product.description;
          } else if (product.description.toLowerCase().includes("velux rooflight")) {
            VeluxRL.push(`${item.quantity}x ${product.name}`);
            if (!VeluxDesc) VeluxDesc = product.description;
          } else if (product.description.toLowerCase().includes("roof lantern")) {
            RoofLantern.push(`${item.value}x ${product.name}`);
            if (!RoofLanternDesc) RoofLanternDesc = product.description;
          } else if (product.description.toLowerCase().includes("slimglaze")) {
            Slimglaze.push(`${item.value}x ${product.name}`);
            if (!SlimglazeDesc) SlimglazeDesc = product.description;
          } else if (product.description.toLowerCase().includes("white upvc")) {
            whiteUPVC.push(`${item.value}x ${product.name}`);
            if (!whiteUPVCDesc) whiteUPVCDesc = product.description;
          } else if (product.description.toLowerCase().includes("grey aluminium")) {
            greyAluminium.push(`${item.value}x ${product.name}`);
            if (!greyAluminiumDesc) greyAluminiumDesc = product.description;
          } else if (product.description.toLowerCase().includes("glazing vision")) {
            glazingVision.push(`${item.value}x ${product.name}`);
            if (!glazingVisionDesc) glazingVisionDesc = product.description;
          } else if (section.name.toLowerCase().includes("description")) {
            Descriptions.push("");
            if (!DescriptionsDesc) DescriptionsDesc = product.description;
          } else if (valueUnit === "m²") {
            SquareMeterage.push(`(${item.value}m²)`);
            if (!SquareMeterageDesc) SquareMeterageDesc = product.description;
          }
          else {
            if (item.value === 1) {
            otherItems.push(`${product.description}`);
            }
            if (item.value > 1) {
            otherItems.push(`${item.value}x ${product.description}`);
          }
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

        function formatDescArray(arr: string[], description: string) {
          if (!arr.length) return null;
          if (arr.length === 1) return `${arr[0]} ${description}`;

          const last = arr[arr.length - 1];
          const rest = arr.slice(0, -1);

          return `${rest.join(", ")} and ${last} ${description}`;

        }

        const descriptions = [
          formatValueArray(SquareMeterage, SquareMeterageDesc || ""),
          formatValueArray(SSColumns, SSColumnsDesc || "Structural Support Columns"),
          formatValueArray(steelBeams, steelBeamsDesc || "Steel Beams"),
          formatValueArray(RHSsteel, RHSsteelDesc || "RHS Steel"),
          formatNameArray(VeluxRL, VeluxDesc || "Velux Rooflight"),
          formatNameArray(RoofLantern, RoofLanternDesc || "Roof Lantern"),
          formatNameArray(Slimglaze, SlimglazeDesc || "Slimglaze SG2Double"),
          formatNameArray(whiteUPVC, whiteUPVCDesc || "White UPVC Window"),
          formatNameArray(greyAluminium, greyAluminiumDesc || "Grey Aluminium Window"),
          formatNameArray(glazingVision, glazingVisionDesc || "Glazing Vision Window"),
          formatDescArray(Descriptions, DescriptionsDesc || ""),
          ...otherItems
        ].filter(Boolean);

        const paragraph = descriptions.join(", ") + ".";
        const splitText = doc.splitTextToSize(paragraph, 170);
        const lh = getLineHeight(doc);
        // ensure there's enough space for title + paragraph, otherwise new page
        if (yPos + (splitText.length + 1) * lh > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          yPos = 20;
        }
        
        if (section.name.toLowerCase().includes("description") === false) {
          doc.setFontSize(12);
          doc.setFont("helvetica", 'bold');
          doc.text(section.name, 20, yPos);
          yPos += lh;
          doc.setFont("helvetica", 'normal');
          doc.setFontSize(11);
          yPos = placeTextLines(doc, splitText, 20, yPos);
          yPos += lh * 0.8;
        } 
        // DESCRIPTION SECTION PRESENT
        else if (section.name.toLowerCase().includes("description")) {
          doc.setFont("helvetica", 'normal');
          doc.setFontSize(11);
          yPos = placeTextLines(doc, splitText, 20, yPos);
          yPos += lh * 0.8;
        }
      }
    });


    const pageHeight1 = doc.internal.pageSize.getHeight();
    const pageWidth1 = doc.internal.pageSize.getWidth();
    const marginLeft1 = 20;
    const marginRight1 = 20;
    const maxWidth1 = pageWidth1 - marginLeft1 - marginRight1;
    const lineHeight1 = 5;
    // Add financial summary;
    doc.setFontSize(14);
    yPos += 8;

    if (yPos + 40 > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      yPos = 20;
    }


    doc.text('PRICING SUMMARY', 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.text(`Subtotal: ${gbpFormatter.format(subtotal)}`, 20, yPos);
    yPos += 7;
    doc.text(`VAT (20%): ${gbpFormatter.format(vat)}`, 20, yPos);
    yPos += 7;
    doc.setFont("helvetica", 'bold');
    doc.text(`Total: ${gbpFormatter.format(grandTotal)}`, 20, yPos);
    yPos += 15;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);

    doc.text("Extra Costs:", 20, yPos);
    yPos += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);



    // Wrap text
    const extraCostsLines = doc.splitTextToSize(
      extraCostsText ?? "No additional costs specified.",
      maxWidth1
    );

    // Paginate ONLY this section
    extraCostsLines.forEach((line: string) => {
      if (yPos + lineHeight1 > pageHeight1 - 20) {
        doc.addPage();
        yPos = 20;

        // Optional: repeat section title on new page
        doc.setFont("helvetica", "bold");
        doc.text("Extra Costs (cont.):", marginLeft1, yPos);
        yPos += 8;

        doc.setFont("helvetica", "normal");
      }

      doc.text(line, marginLeft1, yPos);
      yPos += lineHeight1;
    });

    yPos += 5;

// ----- Pricing Text -----

    const pageHeight2 = doc.internal.pageSize.getHeight();
    const pageWidth2 = doc.internal.pageSize.getWidth();

    const marginLeft2 = 20;
    const marginRight2 = 20;
    const maxWidth2 = pageWidth2 - marginLeft2 - marginRight2;
    const lineHeight2 = 5;

    // Section title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);

    if (yPos + lineHeight2 > pageHeight2 - 20) {
      doc.addPage();
      yPos = 20;
    }

    doc.text("Establishing This Quote:", marginLeft2, yPos);
    yPos += lineHeight2 + 3;

    // Content
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    // Wrap text correctly
    const wrappedText2 = doc.splitTextToSize(
      pricingText,
      maxWidth2
    );

    // Render with pagination
    wrappedText2.forEach((line: string) => {
      if (yPos + lineHeight2 > pageHeight2 - 20) {
        doc.addPage();
        yPos = 20;
      }

      doc.text(line, marginLeft2, yPos);
      yPos += lineHeight2;
    });

    
    const pageHeight4 = doc.internal.pageSize.getHeight();

    if (yPos + 70 > pageHeight4) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text('On behalf of:', 20, yPos + 10);
    doc.text('Michael Smith,', 20, yPos + 15);
    doc.text('Sales Director,', 20, yPos + 20);
    doc.text('North London Loft Rooms', 20, yPos + 25);

    logos.forEach(logo => {
      doc.addImage(
        logo.src, 
        'PNG', 
        10, 
        yPos + 30, 
        logo.width, 
        logo.height
      );
    });

    doc.addPage();
    yPos = 20;

    
    // ----- TERMS & CONDITIONS -----

    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();

    const marginLeft = 20;
    const marginRight = 20;
    const maxWidth = pageWidth - marginLeft - marginRight;
    const lineHeight = 4;

    // Section title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);

    if (yPos + lineHeight > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }

    doc.text("Terms and Conditions:", marginLeft, yPos);
    yPos += lineHeight + 3;

    // Content
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    // Wrap text correctly
    const wrappedText = doc.splitTextToSize(
      termsAndConditions,
      maxWidth
    );

    // Render with pagination
    wrappedText.forEach((line: string) => {
      if (yPos + lineHeight > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }

      doc.text(line, marginLeft, yPos);
      yPos += lineHeight;
    });


    
    // Save the PDF

    doc.save(`quotation-${formData.name.replace(/\s+/g, "-")}.pdf`);
    return doc;
  };




  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("quotationSections", JSON.stringify(sections));
    localStorage.setItem("quotationProducts", JSON.stringify(products));
    localStorage.setItem("CommissionA", CommissionA.toString());
    localStorage.setItem("CommissionB", CommissionB.toString());
    localStorage.setItem("CommissionC", CommissionC.toString());
    localStorage.setItem("vatRate", vatRate.toString());
  }, [sections, products, vatRate, CommissionA, CommissionB, CommissionC]);







  if (!role) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Extension Quotation App</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">
              Select your role to continue
            </p>
            <div className="flex flex-col gap-4">
              <Button 
                onClick={() => setRole("user")}
                className="h-14 text-lg"
              >
                User - Generate Quote
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setRole("admin")}
                className="h-14 text-lg"
              >
                Admin - Manage Products
              </Button>
            </div>
          </CardContent>
          <div className="text-center mb-8 mt-4 text-sm text-muted-foreground ">
            Developed by Ted Melville - melvilleted@hotmail.com
          </div>
        </Card>

      </div>
    );
  }

  // User view

  if (role === "user") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-primary">Extension Quotations - Client Side</h1>
            <Button 
              variant="outline" 
              onClick={() => setRole(null)}
            >
              Change Role
            </Button>
          </div>

          <div className="flex gap-2 mb-4">
            {/* Top download button removed; kept at bottom of page */}
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Client Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  placeholder="e.g. John Smith"
                />
              </div>
              <div>
                <Label htmlFor="address">Client Address</Label>
                <Textarea 
                  id="address" 
                  name="address" 
                  value={formData.address} 
                  onChange={handleInputChange} 
                  placeholder="e.g 123 Main Street, London"
                />
              </div>
            </CardContent>
          </Card>


          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Bespoke Image Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {images.map(image => (
                  <div key={image.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <img 
                      src={image.src} 
                      alt={image.name} 
                      className="w-12 h-12 object-contain"
                    />
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor={`x-${image.id}`}>X Position</Label>
                        <Input
                          id={`x-${image.id}`}
                          type="number"
                          value={image.x}
                          onChange={(e) => updateImagePosition(image.id, Number(e.target.value), image.y)}
                          min="0"
                          max="210"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`y-${image.id}`}>Y Position</Label>
                        <Input
                          id={`y-${image.id}`}
                          type="number"
                          value={image.y}
                          onChange={(e) => updateImagePosition(image.id, image.x, Number(e.target.value))}
                          min="0"
                          max="297"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`w-${image.id}`}>Width</Label>
                        <Input
                          id={`w-${image.id}`}
                          type="number"
                          value={image.width}
                          onChange={(e) => updateImageSize(image.id, Number(e.target.value), image.height)}
                          min="5"
                          max="100"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`h-${image.id}`}>Height</Label>
                        <Input
                          id={`h-${image.id}`}
                          type="number"
                          value={image.height}
                          onChange={(e) => updateImageSize(image.id, image.width, Number(e.target.value))}
                          min="5"
                          max="100"
                        />
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeImage(image.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  className="w-full border-2 border-dashed"
                  onClick={() => fileInputRef1.current?.click()}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Images
                </Button>
              </div>
              
              <input
                type="file"
                ref={fileInputRef1}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
              />
              
              {images.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Image: xPos = 15, yPos = 110, Width = 180, Height = 100.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="mb-4">
              <CardHeader className="flex items-center justify-between cursor-pointer" onClick={() => setSelectProductsExpanded(prev => !prev)}>
                <CardTitle>Select Products</CardTitle>
                <span className="text-sm text-gray-500">{selectProductsExpanded ? '▲' : '▼'}</span>
              </CardHeader>
              {selectProductsExpanded && (
                <CardContent className="p-4">
                  <Accordion type="multiple" className="space-y-4">
                  {sections.map(section => {
                    const sectionProducts = products.filter(p => p.section === section.id);
                    if (sectionProducts.length === 0) return null;
                    
                    return (
                      <AccordionItem value={section.id} key={section.id}>
                        <Card className="mb-2">
                          <CardHeader>
                            <AccordionTrigger>
                              <CardTitle>{section.name}</CardTitle>
                            </AccordionTrigger>
                          </CardHeader>
                          <AccordionContent>
                            <CardContent className="space-y-4">
                              {sectionProducts.map(product => {
                                const productItems = formData.items.filter(item => item.productId === product.id);
                                return (
                                  <div key={product.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-3">
                                      <div>
                                        <h3 className="font-medium">{product.name}</h3>
                                        <p className="text-sm text-muted-foreground">{product.description}</p>
                                        {product.isCustomPricing ? (
                                          <div className="text-sm text-muted-foreground mt-1">Custom pricing - see details</div>
                                        ) : (
                                          <p className="text-sm text-muted-foreground">£{product.price.toFixed(2)} per {product.valueType === "unit" ? "unit" : product.valueType === "meter" ? "meter" : "m²"}</p>
                                        )}
                                      </div>
                                      <Button onClick={() => handleAddItem(product.id)} size="sm">
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add
                                      </Button>
                                    </div>

                                    {productItems.length > 0 && (
                                      <div className="space-y-3 mt-3">
                                        {productItems.map(item => (
                                          <div key={item.id} className="flex flex-wrap items-center gap-2 p-2 border rounded">
                                            <div className="flex items-center gap-2">
                                              <Label htmlFor={`value-${item.id}`} className="text-sm">
                                                {product.valueType === "unit" ? "Quantity" : product.valueType === "meter" ? "Length (m)" : "Area (m²)"}
                                              </Label>
                                              <Input id={`value-${item.id}`} type="number" min="0" step={product.valueType === "unit" ? "0" : "0.01"} value={item.value} onChange={(e) => handleItemValueChange(item.id, parseFloat(e.target.value) || 0)} className="w-20" placeholder={product.valueType === "unit" ? "Qty" : product.valueType === "meter" ? "m" : "m²"} />
                                              <span className="text-sm text-muted-foreground">{product.valueType === "unit" ? "units" : product.valueType === "meter" ? "m" : "m²"}</span>
                                            </div>

                                            {product.valueType !== "unit" && (
                                              <div className="flex items-center gap-2">
                                                <Label htmlFor={`quantity-${item.id}`} className="text-sm">Quantity</Label>
                                                <Input id={`quantity-${item.id}`} type="number" min="1" step="1" value={item.quantity} onChange={(e) => handleItemQuantityChange(item.id, parseInt(e.target.value) || 1)} className="w-20" placeholder="Qty" />
                                                <span className="text-sm text-muted-foreground">units</span>
                                              </div>
                                            )}

                                            <div className="flex items-center gap-2">
                                              <span className="text-sm font-medium">£{calculateItemTotal(item).toFixed(2)}</span>
                                              <Button variant="outline" size="icon" onClick={() => handleRemoveItem(item.id)}>
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </CardContent>
                          </AccordionContent>
                        </Card>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
                </CardContent>
              )}
            </Card>
          </div>
          {/* PdfPreview removed */}

          <Card className="mt-8">
            <CardContent className="pt-6">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Products Total:</span>
                  <span>£{calculateProductsTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT on Products ({vatRate}%):</span>
                  <span>£{calculateProductsVAT().toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Products + VAT:</span>
                  <span>£{calculateProductsTotalWithVAT().toFixed(2)}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span>Commission A = {CommissionA}%:</span>
                  <span>£{calculateCommissionA().toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Commission B = {CommissionB}%:</span>
                  <span>£{calculateCommissionB().toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Commission C = {CommissionC}%:</span>
                  <span>£{calculateCommissionC().toFixed(2)}</span>
                </div>

                <div className="flex justify-between font-medium border-t pt-2 mt-2">
                  <span>Total Commission = ({CommissionA+CommissionB+CommissionC}%):</span>
                  <span>£{calculateTotalCommission().toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>VAT on Commission ({vatRate}%):</span>
                  <span>£{calculateCommissionVAT().toFixed(2)}</span>
                </div>

                <div className="flex justify-between border-t pt-2 mt-2 font-bold">
                  <span>Total Cost (Products + Commission):</span>
                  <span>£{calculateTotalCost().toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total VAT (Products VAT + Commission VAT):</span>
                  <span>£{calculateTotalVAT().toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2 text-lg font-bold">
                  <span>Grand Total:</span>
                  <span>£{calculateGrandTotal().toFixed(2)}</span>
                </div>
              </div>
              
              <div className="space-y-2 my-6">
                {formData.items.map(item => {
                  const product = products.find(p => p.id === item.productId);
                  if (!product) return null;
                  
                  const itemTotal = calculateItemTotal(item);
                  
                  const valueLabel = product.valueType === "unit" 
                    ? "Quantity" 
                    : product.valueType === "meter" 
                      ? "Length" 
                      : "Area";
                  
                  const quantityLabel = product.valueType === "unit" 
                    ? "" 
                    : "Quantity";
                  
                  return (
                    <div key={item.id} className="border-b pb-2">
                      <div className="flex justify-between">
                        <span>
                          {product.name} - {valueLabel}: {item.value} {product.valueType === "meter" ? "m" : product.valueType === "meterage" ? "m²" : ""}
                          {quantityLabel && ` - ${quantityLabel}: ${item.quantity}`}
                        </span>
                        <span>£{itemTotal.toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex gap-3">
                <Button onClick={generatePDF} className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Generate Extension PDF
                </Button>
                <Button onClick={generatePDF1} className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Generate Working Details PDF
                </Button>
                <Button 
                  onClick={saveQuote} 
                  variant="secondary"
                  className="flex-1"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Quote
                </Button>
              </div>
              <div className="flex flex-wrap gap-4 mb-4">
                <div>
                  <Label htmlFor="fromDate">From</Label>
                  <Input
                    id="fromDate"
                    type="date"
                    value={filterFromDate}
                    onChange={(e) => setFilterFromDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="toDate">To</Label>
                  <Input
                    id="toDate"
                    type="date"
                    value={filterToDate}
                    onChange={(e) => setFilterToDate(e.target.value)}
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilterFromDate("");
                      setFilterToDate("");
                    }}
                  >
                    Clear Filter
                  </Button>
                </div>
              </div>


              {savedQuotes.length > 0 && (
                <div className="mt-8 border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Saved Quotes</h3>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredQuotes.map(quote => (
                      <div
                        key={quote.id}
                        className={`p-4 border rounded-lg ${
                          activeQuote?.id === quote.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div
                            className="cursor-pointer flex-1"
                            onClick={() => loadQuote(quote)}
                          >
                            <h4 className="font-medium">
                              {quote.customerName} — Rev {quote.revision}
                            </h4>

                            <p className="text-sm text-gray-600">
                              Updated: {new Date(quote.updatedAt).toLocaleString()}
                            </p>

                            <p className="text-sm text-gray-500 mt-1">
                              {quote.formData.items.length} items
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      <div className="text-center mt-8 text-sm text-muted-foreground">
        Developed by Ted Melville - melvilleted@hotmail.com
      </div>
      </div>
    );
  }

  // Admin view
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Extension Quotations - Admin Management</h1>
          <Button 
            variant="outline" 
            onClick={() => setRole(null)}
          >
            Change Role
          </Button>
          </div>
        

        <Card className="mb-8">
          <CardHeader className="flex items-center justify-between cursor-pointer" onClick={() => setLogosExpanded(prev => !prev)}>
            <CardTitle>Logo Management</CardTitle>
            <span className="text-sm text-gray-500">{logosExpanded ? '▲' : '▼'}</span>
          </CardHeader>
          {logosExpanded && (
            <CardContent className="space-y-4">
              <div className="space-y-4">
              {logos.map(logo => (
                <div key={logo.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <img 
                    src={logo.src} 
                    alt={logo.name} 
                    className="w-12 h-12 object-contain"
                  />
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor={`x-${logo.id}`}>X Position</Label>
                      <Input
                        id={`x-${logo.id}`}
                        type="number"
                        value={logo.x}
                        onChange={(e) => updateLogoPosition(logo.id, Number(e.target.value), logo.y)}
                        min="0"
                        max="210"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`y-${logo.id}`}>Y Position</Label>
                      <Input
                        id={`y-${logo.id}`}
                        type="number"
                        value={logo.y}
                        onChange={(e) => updateLogoPosition(logo.id, logo.x, Number(e.target.value))}
                        min="0"
                        max="297"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`w-${logo.id}`}>Width</Label>
                      <Input
                        id={`w-${logo.id}`}
                        type="number"
                        value={logo.width}
                        onChange={(e) => updateLogoSize(logo.id, Number(e.target.value), logo.height)}
                        min="5"
                        max="100"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`h-${logo.id}`}>Height</Label>
                      <Input
                        id={`h-${logo.id}`}
                        type="number"
                        value={logo.height}
                        onChange={(e) => updateLogoSize(logo.id, logo.width, Number(e.target.value))}
                        min="5"
                        max="100"
                      />
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeLogo(logo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
                
              <Button
                variant="outline"
                className="w-full border-2 border-dashed"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Upload Logos
              </Button>
            </div>
              
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleLogoUpload}
            />
              
                {logos.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    NLLR Logo: xPos = 15, yPos = 15, Width = 60, Height = 30.
                  </p>
                )}
              </CardContent>
            )}
        </Card>

        {/* Commission and VAT Settings */}
        <Card className="mb-8">
          <CardHeader className="flex items-center justify-between cursor-pointer" onClick={() => setCommissionExpanded(prev => !prev)}>
            <CardTitle>Commission & VAT Settings</CardTitle>
            <span className="text-sm text-gray-500">{commissionExpanded ? '▲' : '▼'}</span>
          </CardHeader>
          {commissionExpanded && (
            <CardContent className="space-y-4">

            <div className="pt-4 border-t">
              <Label htmlFor="CommisionA">Admin (%)</Label>
              <Input
                id="CommissionA"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={CommissionA}
                onChange={(e) => setCommissionA(parseFloat(e.target.value) || 0)}
              />
            </div>

            {/* LocalStorage export/import moved to Data Handling section */}
            <div className="pt-4 border-t">
              <Label htmlFor="CommissionB">Marketing (%)</Label>
              <Input
                id="CommissionB"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={CommissionB}
                onChange={(e) => setCommissionB(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="pt-4 border-t">
              <Label htmlFor="CommissionC">Commission (%)</Label>
              <Input
                id="CommissionC"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={CommissionC}
                onChange={(e) => setCommissionC(parseFloat(e.target.value) || 0)}
              />
            </div>


            <div className="pt-4 border-t">
              <Label htmlFor="vatRate">VAT Rate (%)</Label>
              <Input
                id="vatRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={vatRate}
                onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
              />
            </div>
          </CardContent>
          )}
        </Card>


  {/* Section Management */}
  <Card ref={sectionsCardRef} className="mb-8">
          <CardHeader className="flex items-center justify-between cursor-pointer" onClick={() => setManageSectionsExpanded(prev => !prev)}>
            <CardTitle>Manage Sections</CardTitle>
            <span className="text-sm text-gray-500">{manageSectionsExpanded ? '▲' : '▼'}</span>
          </CardHeader>
          {manageSectionsExpanded && (
            <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="New section name"
              />
              <Button onClick={handleAddSection}>
                <Plus className="mr-2 h-4 w-4" />
                Add Section
              </Button>
            </div>
            
            <div className="space-y-2">
              {sections.map(section => (
                <div key={section.id} className="flex items-center justify-between p-3 border rounded-lg">
                  {editingSection?.id === section.id ? (
                    <div ref={editRowRef} className="flex gap-2 flex-1">
                      <Input
                        id="sectionName"
                        value={sectionToEditName}
                        onChange={(e) => setSectionToEditName(e.target.value)}
                        placeholder="Section name"
                      />
                      <Button onClick={handleUpdateSection} size="sm">
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setEditingSection(null)}
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="flex items-center">
                        {section.name}
                      </span>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditSection(section)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteSection(section.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          )}
        </Card>

        {/* Product Management */}
        <Card ref={productFormRef} className="mb-8">
          <CardHeader className="flex items-center justify-between cursor-pointer" onClick={() => setProductFormExpanded(prev => !prev)}>
            <CardTitle>Add New Product</CardTitle>
            <span className="text-sm text-gray-500">{productFormExpanded ? '▲' : '▼'}</span>
          </CardHeader>
          {productFormExpanded && (
            <CardContent className="space-y-4">
            <div>
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                placeholder="e.g. Double Glazed Window"
              />
            </div>
            
            <div>
              <Label htmlFor="productDescription">Description</Label>
              <Textarea
                id="productDescription"
                value={newProduct.description}
                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                placeholder="Product description..."
              />
            </div>
            
            <div>
              <Label htmlFor="valueType">Value Type</Label>
              <Select 
                value={newProduct.valueType} 
                onValueChange={(value: ValueType) => setNewProduct({...newProduct, valueType: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select value type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unit">Unit (individual items)</SelectItem>
                  <SelectItem value="meter">Meter (length)</SelectItem>
                  <SelectItem value="meterage">Meterage (area m²)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="baseCost">Base Cost (£)</Label>
              
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Base Cost (£)"
                        value={newProduct.baseCost ?? 0}
                        onChange={(e) => {
                          const baseCost = parseFloat(e.target.value) || 0;
                          setNewProduct({
                            ...newProduct, 
                            baseCost: baseCost,
                            price: newProduct.isCustomPricing ? newProduct.price : parseFloat((baseCost * (1 + ((newProduct.markupPercent ?? 0) / 100)) ).toFixed(2))
                          });
                        }}
                      />
            </div>
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={newProduct.supplier}
                onChange={(e) => setNewProduct({...newProduct, supplier: e.target.value})}
                placeholder="Supplier information"
              />
            </div>
            <div>
              <Label htmlFor="baseCost">Markup Percentage(%)</Label>
                        <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Markup Percentage (%)"
                        value={newProduct.markupPercent ?? 0}
                        onChange={(e) => {
                          const markupPercent = parseFloat(e.target.value) || 0;
                          setNewProduct({
                            ...newProduct,
                            markupPercent: markupPercent,
                            price: newProduct.isCustomPricing ? newProduct.price : parseFloat(((newProduct.baseCost ?? 0) * (1 + (markupPercent / 100)) ).toFixed(2))
                          });
                        }}
                      />
            </div>

            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="custom-pricing"
                checked={newProduct.isCustomPricing ?? false}
                onCheckedChange={(checked) => 
                  setNewProduct({
                    ...newProduct, 
                    isCustomPricing: checked as boolean,
                    price: checked ? 0 : newProduct.price
                  })
                }
              />
              <Label htmlFor="custom-pricing">Custom Pricing</Label>
            </div>
            
            {!newProduct.isCustomPricing ? (
              <div>
                <Label htmlFor="productPrice">
                  Price (£ per {newProduct.valueType === "unit" 
                    ? "unit" 
                    : newProduct.valueType === "meter" 
                      ? "meter" 
                      : "m²"})
                </Label>
                <Input
                  id="productPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newProduct.price ?? ""}
                  onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                />
              </div>
              
            ) : (
              <div className="space-y-2">
                <Label>Custom Pricing Tiers</Label>
                {newProduct.customPrices?.map((tier, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label>Value ({newProduct.valueType === "unit" 
                        ? "units" 
                        : newProduct.valueType === "meter" 
                          ? "meters" 
                          : "m²"})</Label>
                      <Input
                        type="number"
                        min="0"
                        step={newProduct.valueType === "unit" ? "1" : "0.01"}
                        placeholder={newProduct.valueType === "unit" 
                          ? "Quantity" 
                          : newProduct.valueType === "meter" 
                            ? "Length (m)" 
                            : "Area (m²)"}
                        value={tier.value ?? ""}
                        onChange={(e) => {
                          const newTiers = [...(newProduct.customPrices ?? [])];
                          newTiers[index].value = parseFloat(e.target.value) || 0;
                          setNewProduct({...newProduct, customPrices: newTiers});
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <Label>Price (£)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        value={tier.price ?? ""}
                        onChange={(e) => {
                          const newTiers = [...(newProduct.customPrices ?? [])];
                          newTiers[index].price = parseFloat(e.target.value) || 0;
                          setNewProduct({...newProduct, customPrices: newTiers});
                        }}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const newTiers = [...(newProduct.customPrices ?? [])];
                        newTiers.splice(index, 1);
                        setNewProduct({...newProduct, customPrices: newTiers});
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => {
                    const newTiers = [...(newProduct.customPrices ?? []), { value: 0, price: 0 }];
                    setNewProduct({...newProduct, customPrices: newTiers});
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Tier
                </Button>
              </div>

            )}
            
            <div>
              <Label htmlFor="productSection">Section</Label>
              <Select 
                value={newProduct.section} 
                onValueChange={(value) => setNewProduct({...newProduct, section: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map(section => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Format Type removed - no longer used */}
            
            <Button 
              onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
              className="w-full"
            >
              {editingProduct ? (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Product
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </>
              )}
            </Button>
            
            {editingProduct && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingProduct(null);
                  setNewProduct({ 
                    name: "", 
                    description: "",
                    section: sections[0]?.id ?? "", 
                    baseCost: 0,
                    supplier: "",
                    markupPercent: 0,
                    price: 0,
                    valueType: "unit",
                    isCustomPricing: false,
                    customPrices: [{ value: 0, price: 0 }]
                  });
                }}
                className="w-full"
              >
                Cancel Edit
              </Button>
            )}
          </CardContent>
          )}
        </Card>

        <Card className="mb-8">
          <CardHeader className="flex items-center justify-between cursor-pointer" onClick={() => setSectionsExpanded(prev => !prev)}>
            <CardTitle>Sections</CardTitle>
            <span className="text-sm text-gray-500">{sectionsExpanded ? '▲' : '▼'}</span>
          </CardHeader>
          {sectionsExpanded && (
            <CardContent className="space-y-6">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sections.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-6">
                    {sections.map(section => {
                      const sectionProducts = products.filter(p => p.section === section.id);
                      if (sectionProducts.length === 0) return null;
                      return (
                        <SortableSection key={section.id} section={section}>
                          <Card className="mb-8">
                            <CardHeader
                              className="flex flex-row items-center justify-between cursor-pointer"
                              onClick={() => toggleSection(section.id)}
                            >
                              <div className="flex items-center gap-2">
                                <CardTitle>{section.name}</CardTitle>
                              </div>

                              <span className="text-sm text-gray-500">
                                {openSections.includes(section.id) ? "▲" : "▼"}
                              </span>
                            </CardHeader>
                            {openSections.includes(section.id) && (
                              <CardContent className="space-y-4">
                                {sectionProducts.map(product => (
                                  <div key={product.id} className="flex items-start justify-between p-4 border rounded-lg">
                                    <div className="flex-1">
                                      <h3 className="font-medium">{product.name}</h3>
                                      <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                                      <div className="text-sm text-muted-foreground mt-1">
                                        Value Type: {product.valueType === "unit" 
                                          ? "Unit" 
                                          : product.valueType === "meter" 
                                            ? "Meter (length)" 
                                            : "Meterage (area m²)"}
                                      </div>
                                      {product.isCustomPricing ? (
                                        <div className="text-sm text-muted-foreground mt-2">
                                          Custom Pricing:
                                          {product.customPrices?.map((tier, i) => (
                                            <span key={i} className="block">
                                              {tier.value} {product.valueType === "unit" 
                                                ? "units" 
                                                : product.valueType === "meter" 
                                                  ? "m" 
                                                  : "m²"} = £{tier.price.toFixed(2)}
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-muted-foreground mt-1">
                                          £{product.price.toFixed(2)} per {product.valueType === "unit" 
                                            ? "unit" 
                                            : product.valueType === "meter" 
                                              ? "meter" 
                                              : "m²"}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex gap-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleEditProduct(product)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="destructive" 
                                        size="sm"
                                        onClick={() => handleDeleteProduct(product.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </CardContent>
                            )}
                          </Card>
                        </SortableSection>
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </CardContent>
          )}
        </Card>

        <Card className="mb-8">
          <CardHeader className="flex items-center justify-between cursor-pointer" onClick={() => setTextSectionsExpanded(prev => !prev)}>
            <CardTitle>Text Sections</CardTitle>
            <span className="text-sm text-gray-500">{textSectionsExpanded ? '▲' : '▼'}</span>
          </CardHeader>
          {textSectionsExpanded && (
            <CardContent className="space-y-4">
              <div className="space-y-8">
                <Label htmlFor="briefText">Brief</Label>
                <Textarea
                  id="briefText"
                  placeholder="Free text area to enter the Brief Text for the quotation PDF..."
                  className="min-h-[120px]"
                  value={briefText}
                  onChange={(e) => setBriefText(e.target.value)}
                />
              </div>

              <div className="space-y-8">
                <Label htmlFor="extraCostsText">Optional/Extra Costs</Label>
                <Textarea
                  id="extraCostsText"
                  placeholder="Free text area to enter extra add ons for the quotation PDF..."
                  className="min-h-[120px]"
                  value={extraCostsText}
                  onChange={(e) => setExtraCostsText(e.target.value)}
                />
              </div>

              <div className="space-y-8">
                <Label htmlFor="pricingText">Establishing End Cost</Label>
                <Textarea
                  id="pricingText"
                  placeholder="Free text area to enter pricing Text for the quotation PDF..."
                  className="min-h-[120px]"
                  value={pricingText}
                  onChange={(e) => setPricingText(e.target.value)}
                />
              </div>

              <div className="space-y-8">
                <Label htmlFor="TermsText">Terms & Conditions</Label>
                <Textarea
                  id="TermsText"
                  placeholder="Free text area to enter terms and conditions for the quotation PDF..."
                  className="min-h-[120px]"
                  value={termsAndConditions}
                  onChange={(e) => setTermsAndConditions(e.target.value)}
                />
              </div>
            </CardContent>
          )}
        </Card>
          {/* Final Data Handling card (password-protected) */}
          <Card className="mb-8">
            <CardHeader className="flex items-center justify-between cursor-pointer" onClick={() => setDataMigrationExpanded(prev => !prev)}>
              <CardTitle>Data Migration</CardTitle>
              <span className="text-sm text-gray-500">{dataMigrationExpanded ? '▲' : '▼'}</span>
            </CardHeader>
            {dataMigrationExpanded && (
              <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Export or import local data. This area is password protected.</p>
                <div className="flex items-center gap-2">
                  <Input value={dataUser} readOnly />
                  <Input type="password" placeholder="password" value={dataPass} onChange={(e) => setDataPass(e.target.value)} />
                </div>
                <div className="flex items-center gap-4">
                  <Button variant="default" onClick={() => {
                    if (dataPass !== 'password123') { alert('Password incorrect'); return; }
                    exportLocalStorage();
                  }}>Export data</Button>
                  <input
                    ref={el => { importInputRef.current = el }}
                    type="file"
                    accept="application/json"
                    onChange={(e) => importLocalStorageFile(e.target.files ? e.target.files[0] : null)}
                    className="hidden"
                  />
                  <Button variant="destructive" onClick={() => {
                    if (dataPass !== 'password123') { alert('Password incorrect'); return; }
                    if (!confirm('Are you sure you want to import data? This will overwrite local data.')) return;
                    importInputRef.current?.click();
                  }}>Import data</Button>
                </div>
              </div>
            </CardContent>
          )}
          </Card>

          <div className="text-center mt-8 text-sm text-muted-foreground">
              Developed by Ted Melville - melvilleted@hotmail.com - 2025-26
          </div>
      </div>
    </div>
  );
}