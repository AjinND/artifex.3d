export type OrderView = {
  _id: string;
  payment: string;
  fulfillment: string;
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  address: string;
  pin: string;
  carrier?: string;
  tracking?: string;
  lines: {
    name: string;
    material: string;
    dimensions?: string;
    photo?: string;
    pricePaise: number;
    quantity: number;
    leadDays: number;
  }[];
};
export type QuoteView = {
  _id: string;
  title: string;
  brief: string;
  quantity: number;
  product?: string;
  state: string;
  scope?: string;
  amount?: number;
  leadDays?: number;
  version: number;
  expires?: string;
  attachments: string[];
};
export type EnquiryView = {
  _id: string;
  name: string;
  email: string;
  message: string;
  reply?: string;
  replyState?: string;
};
