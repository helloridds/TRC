import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get('barcode');

  if (!barcode) {
    return NextResponse.json({ error: 'Barcode is required' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      {
        headers: {
          'User-Agent': 'TRC-Cafe-App/1.0 (contact@trc.cafe)',
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch from Open Food Facts' }, { status: 502 });
    }

    const data = await res.json();

    if (data.status !== 1) {
      return NextResponse.json({ error: 'Product not found in Open Food Facts' }, { status: 404 });
    }

    const product = data.product;
    return NextResponse.json({
      found: true,
      barcode,
      name: product.product_name || product.product_name_en || '',
      brand: product.brands || '',
      category: product.categories_tags?.[0]?.replace('en:', '') || '',
      image_url: product.image_url || product.image_front_url || '',
      nutrition: {
        energy_kcal: product.nutriments?.['energy-kcal_100g'] || null,
        proteins: product.nutriments?.['proteins_100g'] || null,
        carbs: product.nutriments?.['carbohydrates_100g'] || null,
        fats: product.nutriments?.['fat_100g'] || null,
        fiber: product.nutriments?.['fiber_100g'] || null,
        salt: product.nutriments?.['salt_100g'] || null,
      },
      quantity: product.quantity || '',
      ingredients: product.ingredients_text || '',
    });
  } catch (error) {
    console.error('Open Food Facts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
