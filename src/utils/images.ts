export const convertToJpeg = (image: Blob | string): Promise<Blob> => {
  const imageUrl =
    typeof image === "string" ? image : URL.createObjectURL(image);
  const imgElement = new Image();
  imgElement.src = imageUrl;
  imgElement.onerror = () => {
    console.error("Image format isn't supported while converting to jpeg");
  };

  return new Promise((resolve, _) => {
    imgElement.onload = function (this: void) {
      const canvas = document.createElement("canvas");
      canvas.width = imgElement.naturalWidth;
      canvas.height = imgElement.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("Can't get Canvas Context while converting to jpeg");
        return;
      }
      ctx.drawImage(imgElement, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          console.error("blob conversion failed while converting to jpeg");
        }
      }, "image/png");
      imgElement.remove();
    };
  });
};
