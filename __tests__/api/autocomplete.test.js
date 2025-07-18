const axios = require('axios');

// Mock axios at the module level
jest.mock('axios', () => ({
  get: jest.fn()
}));

const handler = require('../../pages/api/autocomplete.ts').default;

describe('/api/autocomplete', () => {
  let req, res;

  beforeEach(() => {
    req = {
      query: {}
    };
    res = {
      status: jest.fn(() => res),
      json: jest.fn(() => res),
      setHeader: jest.fn(() => res)
    };
    jest.clearAllMocks();
  });

  test('should return 500 for empty query', async () => {
    req.query.q = '';
    
    await handler(req, res);
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid query' });
  });

  test('should return 500 for missing query', async () => {
    req.query.q = undefined;
    await handler(req, res);
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid query' });
  });

  test('should make API call and return formatted data', async () => {
    const mockResponse = {
      data: {
        predictions: [
          {
            place_id: 'test-place-id',
            structured_formatting: {
              main_text: 'Test Location',
              secondary_text: 'Test Area'
            }
          }
        ]
      }
    };

    axios.get.mockResolvedValue(mockResponse);
    req.query.q = 'test location';

    await handler(req, res);

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('https://maps.googleapis.com/maps/api/place/autocomplete/json'),
      expect.objectContaining({
        headers: {
          'Accept-Encoding': 'application/json'
        }
      })
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      {
        place_id: 'test-place-id',
        main_text: 'Test Location',
        secondary_text: 'Test Area'
      }
    ]);
  });

  test('should handle API errors gracefully', async () => {
    const mockError = new Error('API Error');
    axios.get.mockRejectedValue(mockError);
    req.query.q = 'test location';

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error: API Error' });
  });

  test('should set CORS headers correctly', async () => {
    const mockResponse = {
      data: {
        predictions: []
      }
    };

    axios.get.mockResolvedValue(mockResponse);
    req.query.q = 'test location';

    await handler(req, res);

    // Verify CORS headers are set
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
  });

  test('should allow cross-domain requests', async () => {
    const mockResponse = {
      data: {
        predictions: []
      }
    };

    axios.get.mockResolvedValue(mockResponse);
    req.query.q = 'test location';

    await handler(req, res);

    // Verify that Access-Control-Allow-Origin is set to '*' to allow all domains
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
    
    // Verify that credentials are allowed (important for cross-domain requests)
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
  });
});