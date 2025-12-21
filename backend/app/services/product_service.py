from app.models.product_attribute_value import ProductAttributeValue
from app.models.product_attribute_key import ProductAttributeKey

def get_product_size(db, product_id: int) -> str | None:
    size_attr = (
        db.query(ProductAttributeValue.value)
        .join(
            ProductAttributeKey,
            ProductAttributeValue.attribute_id == ProductAttributeKey.attribute_id
        )
        .filter(
            ProductAttributeValue.product_id == product_id,
            ProductAttributeKey.name.in_(["용량", "중량", "수량"])
        )
        .first()
    )

    return size_attr[0] if size_attr else None
