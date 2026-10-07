export const CATEGORIES = {
  general: { label: 'ขยะทั่วไป', sub: 'ซองขนม ทิชชู่ กล่องโฟม', color: '#2D58D8' },
  special: { label: 'ขยะอันตราย', sub: 'แบตเตอรี่ สายไฟ อุปกรณ์อิเล็กทรอนิกส์', color: '#E23D3D' },
  recycle: { label: 'ขยะรีไซเคิล', sub: 'พลาสติก แก้ว กระดาษ โลหะ', color: '#F2C536' },
  organic: { label: 'ขยะเปียก', sub: 'เศษอาหารและวัสดุย่อยสลายได้', color: '#1E9D63' },
};

// ค่า CO2e ใน prototype นี้เป็น "ค่าประมาณเพื่อการสื่อสารในเกม" ไม่ใช่ carbon accounting ที่รับรอง
// ก่อนใช้งานในงานจริง ควรแทนที่ด้วย emission factor จากแหล่งที่ผู้จัดงานเลือกใช้อ้างอิง
export const WASTE_ITEMS = [
  { id:'pet', short:'ขวด PET', label:'ขวดพลาสติก PET', category:'recycle', asset:'assets/waste_png/pet-bottle.png', co2eKg:0.060, circular:'shirt' },
  { id:'can', short:'กระป๋อง', label:'กระป๋องอะลูมิเนียม', category:'recycle', asset:'assets/waste_png/can.png', co2eKg:0.150, circular:'shirt' },
  { id:'glass', short:'ขวดแก้ว', label:'ขวดแก้ว', category:'recycle', asset:'assets/waste_png/glass-bottle.png', co2eKg:0.055, circular:'shirt' },
  { id:'cardboard', short:'กระดาษ', label:'กล่องกระดาษ', category:'recycle', asset:'assets/waste_png/cardboard.png', co2eKg:0.045, circular:'shirt' },
  { id:'yogurt', short:'ถ้วยโยเกิร์ต', label:'ถ้วยโยเกิร์ต', category:'recycle', asset:'assets/waste_png/yogurt-cup.png', co2eKg:0.035, circular:'shirt' },
  { id:'banana', short:'เปลือกกล้วย', label:'เปลือกกล้วย', category:'organic', asset:'assets/waste_png/banana-peel.png', co2eKg:0.030, circular:'plant' },
  { id:'apple', short:'แกนแอปเปิล', label:'แกนแอปเปิล', category:'organic', asset:'assets/waste_png/apple-core.png', co2eKg:0.028, circular:'plant' },
  { id:'coffee', short:'กากกาแฟ', label:'กากกาแฟ', category:'organic', asset:'assets/waste_png/coffee-grounds.png', co2eKg:0.025, circular:'plant' },
  { id:'food', short:'เศษอาหาร', label:'เศษอาหาร', category:'organic', asset:'assets/waste_png/food-scraps.png', co2eKg:0.032, circular:'plant' },
  { id:'tissue', short:'ทิชชู่', label:'ทิชชู่ใช้แล้ว', category:'general', asset:'assets/waste_png/tissue.png', co2eKg:0.015, circular:null },
  { id:'wrapper', short:'ซองขนม', label:'ซองขนม', category:'general', asset:'assets/waste_png/wrapper.png', co2eKg:0.018, circular:null },
  { id:'foam', short:'กล่องโฟม', label:'กล่องโฟม', category:'general', asset:'assets/waste_png/foam-box.png', co2eKg:0.020, circular:null },
  { id:'battery', short:'ถ่านไฟฉาย', label:'ถ่านไฟฉาย', category:'special', asset:'assets/waste_png/battery.png', co2eKg:0.080, circular:'chip' },
  { id:'cable', short:'สายชาร์จ', label:'สายชาร์จเก่า', category:'special', asset:'assets/waste_png/cable.png', co2eKg:0.095, circular:'chip' },
  { id:'phone', short:'โทรศัพท์', label:'โทรศัพท์เก่า', category:'special', asset:'assets/waste_png/phone.png', co2eKg:0.130, circular:'chip' },
  { id:'board', short:'แผงวงจร', label:'แผงวงจร', category:'special', asset:'assets/waste_png/circuit-board.png', co2eKg:0.180, circular:'chip', rare:true },
  { id:'plastic-cup', short:'แก้วพลาสติก', label:'แก้วพลาสติกพร้อมหลอด', category:'general', asset:'assets/waste_png_new/plastic-cup.png', co2eKg:0.020, circular:null },
  { id:'milk-carton', short:'กล่องนม', label:'กล่องนม', category:'recycle', asset:'assets/waste_png_new/milk-carton.png', co2eKg:0.040, circular:'shirt' },
  { id:'newspaper', short:'หนังสือพิมพ์', label:'หนังสือพิมพ์', category:'recycle', asset:'assets/waste_png_new/newspaper.png', co2eKg:0.035, circular:'shirt' },
  { id:'plastic-bag', short:'ถุงพลาสติก', label:'ถุงพลาสติกใช้แล้ว', category:'general', asset:'assets/waste_png_new/plastic-bag.png', co2eKg:0.016, circular:null },
  { id:'plastic-spoon', short:'ช้อนพลาสติก', label:'ช้อนพลาสติกใช้แล้ว', category:'general', asset:'assets/waste_png_new/plastic-spoon.png', co2eKg:0.010, circular:null },
  { id:'face-mask', short:'หน้ากาก', label:'หน้ากากอนามัยใช้แล้ว', category:'general', asset:'assets/waste_png_new/face-mask.png', co2eKg:0.012, circular:null },
  { id:'eggshell', short:'เปลือกไข่', label:'เปลือกไข่', category:'organic', asset:'assets/waste_png_new/eggshell.png', co2eKg:0.012, circular:'plant' },
  { id:'tea-bag', short:'ถุงชา', label:'ถุงชาใช้แล้ว', category:'organic', asset:'assets/waste_png_new/tea-bag.png', co2eKg:0.015, circular:'plant' },
  { id:'spray-can', short:'กระป๋องสเปรย์', label:'กระป๋องสเปรย์', category:'special', asset:'assets/waste_png_new/spray-can.png', co2eKg:0.070, circular:'chip' },
  { id:'light-bulb', short:'หลอดไฟ', label:'หลอดไฟใช้แล้ว', category:'special', asset:'assets/waste_png_new/light-bulb.png', co2eKg:0.060, circular:'chip' },
  { id:'glass-jar', short:'โหลแก้ว', label:'โหลแก้ว', category:'recycle', asset:'assets/waste_png_new/glass-jar.png', co2eKg:0.050, circular:'shirt' },
  { id:'coffee-cup', short:'แก้วกาแฟ', label:'แก้วกาแฟใช้แล้ว', category:'general', asset:'assets/waste_png_new/coffee-cup.png', co2eKg:0.018, circular:null },
];

export const CIRCULAR_PRODUCTS = {
  shirt: { label: 'เส้นใยและผลิตภัณฑ์รีไซเคิล', asset:'assets/products/recycled-shirt.svg' },
  plant: { label: 'ปุ๋ยหมักและพื้นที่สีเขียว', asset:'assets/products/compost-plant.svg' },
  chip: { label: 'วัสดุอิเล็กทรอนิกส์ที่นำกลับมาใช้ใหม่', asset:'assets/products/recovered-chip.svg' },
};
