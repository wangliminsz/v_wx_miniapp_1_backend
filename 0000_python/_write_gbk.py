"""Write a real GBK CSV (no BOM) and verify."""
import os

data = 'productSlug,variantSku,variantName,variantPrice,taxCategoryName,variantFacetValues,stockLevels,variantAssets,variantFeaturedAsset,options\n'
data += '"he1086l-g20-002","HE1086L-G20-002","[HE1086L-G20-002] 黑色平光环氧防腐粉末涂料","29","Zero Tax","","HE1086L-G20-002: 1000","","","spec-package:20kg"\n'

path = r'd:\wx_mini_backend_dev_dev_dev\0000_python\_test_real_gbk.csv'
with open(path, 'wb') as f:
    f.write(data.encode('gbk'))  # no BOM, pure GBK
print('Wrote', os.path.getsize(path), 'bytes (GBK, no BOM)')

with open(path, 'rb') as f:
    raw = f.read()
print('First 8 bytes:', raw[:8].hex(), '(no BOM expected)')
