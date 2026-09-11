#!/bin/bash

echo "🔍 Verifying Complete Admin Panels System"
echo "=========================================="
echo ""

FAILURES=0

# Check backends
echo "1️⃣  Checking Backend Services..."
echo ""

backends=("CURRENT:3000" "Justice Desk:3001" "Vakeel Sahib:3002" "MediDeals:3003")

for backend in "${backends[@]}"; do
    name="${backend%:*}"
    port="${backend##*:}"

    echo -n "  🔗 $name (port $port): "
    if curl -s http://localhost:$port/api/*/health &>/dev/null; then
        echo "✅ Healthy"
    else
        echo "❌ Not responding"
        ((FAILURES++))
    fi
done

echo ""
echo "2️⃣  Checking API Endpoints..."
echo ""

# Test CURRENT endpoints
echo -n "  📰 CURRENT Metrics: "
if curl -s http://localhost:3000/api/current/metrics | jq -e '.totalStories' &>/dev/null; then
    echo "✅ Working"
else
    echo "❌ Failed"
    ((FAILURES++))
fi

echo -n "  📰 CURRENT Providers: "
if curl -s http://localhost:3000/api/current/providers | jq -e '.[0].name' &>/dev/null; then
    echo "✅ Working"
else
    echo "❌ Failed"
    ((FAILURES++))
fi

# Test Justice Desk endpoints
echo -n "  ⚖️  Justice Desk Users: "
if curl -s "http://localhost:3001/api/justice-desk/users?limit=1" | jq -e '.data[0].id' &>/dev/null; then
    echo "✅ Working"
else
    echo "❌ Failed"
    ((FAILURES++))
fi

echo -n "  ⚖️  Justice Desk KYC Metrics: "
if curl -s http://localhost:3001/api/justice-desk/kyc/metrics | jq -e '.totalUsers' &>/dev/null; then
    echo "✅ Working"
else
    echo "❌ Failed"
    ((FAILURES++))
fi

# Test Vakeel Sahib endpoints
echo -n "  👨‍⚖️  Vakeel Sahib Advocates: "
if curl -s "http://localhost:3002/api/vakeel-sahib/advocates?limit=1" | jq -e '.data[0].id' &>/dev/null; then
    echo "✅ Working"
else
    echo "❌ Failed"
    ((FAILURES++))
fi

echo -n "  👨‍⚖️  Vakeel Sahib KYC Metrics: "
if curl -s http://localhost:3002/api/vakeel-sahib/kyc/metrics | jq -e '.totalAdvocates' &>/dev/null; then
    echo "✅ Working"
else
    echo "❌ Failed"
    ((FAILURES++))
fi

# Test MediDeals endpoints
echo -n "  💊 MediDeals Users: "
if curl -s "http://localhost:3003/api/medideals/users?limit=1" | jq -e '.data[0].id' &>/dev/null; then
    echo "✅ Working"
else
    echo "❌ Failed"
    ((FAILURES++))
fi

echo -n "  💊 MediDeals Orders: "
if curl -s "http://localhost:3003/api/medideals/orders?limit=1" | jq -e '.data[0].id' &>/dev/null; then
    echo "✅ Working"
else
    echo "❌ Failed"
    ((FAILURES++))
fi

echo ""
echo "3️⃣  Checking Admin Operations..."
echo ""

# Test write operations
echo -n "  ✍️  Document Verification: "
if curl -s -X POST http://localhost:3001/api/justice-desk/users/user-1/documents/doc-1/verify \
  -H "Content-Type: application/json" -d '{}' | jq -e '.success' &>/dev/null; then
    echo "✅ Working"
else
    echo "❌ Failed"
    ((FAILURES++))
fi

echo -n "  ✍️  Bar Enrollment Verification: "
if curl -s -X POST http://localhost:3002/api/vakeel-sahib/advocates/advocate-1/bar-enrollment/verify \
  -H "Content-Type: application/json" -d '{}' | jq -e '.success' &>/dev/null; then
    echo "✅ Working"
else
    echo "❌ Failed"
    ((FAILURES++))
fi

echo -n "  ✍️  Order Status Update: "
if curl -s -X PATCH http://localhost:3003/api/medideals/orders/order-1/status \
  -H "Content-Type: application/json" -d '{"status":"shipped"}' | jq -e '.success' &>/dev/null; then
    echo "✅ Working"
else
    echo "❌ Failed"
    ((FAILURES++))
fi

echo ""
echo "4️⃣  Checking Frontend..."
echo ""

echo -n "  🌐 Frontend Dev Server (port 4173): "
if curl -s http://localhost:4173/ | grep -q "<!DOCTYPE" || curl -s http://localhost:4173/ | grep -q "<html"; then
    echo "✅ Running"
else
    echo "⚠️  Not responding (may not be started)"
fi

echo ""
echo "=========================================="
if [ $FAILURES -eq 0 ]; then
    echo "✅ All Systems Operational!"
    echo ""
    echo "Admin Panel URLs:"
    echo "  🌐 CURRENT:       http://localhost:4173/?product=current"
    echo "  🌐 Justice Desk:  http://localhost:4173/?product=justice-desk"
    echo "  🌐 Vakeel Sahib:  http://localhost:4173/?product=vakeel-sahib"
    echo "  🌐 MediDeals:     http://localhost:4173/?product=medideals"
    echo ""
    echo "Demo Login: Use any email and password (demo mode)"
    exit 0
else
    echo "❌ $FAILURES system(s) failed verification"
    echo ""
    echo "Troubleshooting:"
    echo "1. Make sure all backend services are running:"
    echo "   cd backend && ./start-all.sh"
    echo "2. Make sure frontend is running:"
    echo "   npm run dev"
    echo "3. Check that ports 3000-3003 and 4173 are available"
    exit 1
fi
