export async function onRequestGet() {
  const approvedReviews = [
    {
      name: 'Client Review',
      text: 'Shawna was professional, on time, and my hair came out exactly how I wanted it.'
    },
    {
      name: 'Braids Client',
      text: 'The parting was clean, the style lasted, and the whole appointment felt smooth and organized.'
    },
    {
      name: 'Returning Guest',
      text: 'Great experience from booking to finish. I would absolutely book again.'
    }
  ];

  return new Response(JSON.stringify({ reviews: approvedReviews }), {
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'cache-control': 'no-store'
    }
  });
}
