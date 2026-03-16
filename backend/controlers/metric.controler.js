export const addMetric = (req, res) => {
  try {
    const data = req.body;

    console.log(data);

    return res.status(200).json({
      message: "Collected the data successfully",
      success: true,
      data: data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to collect the data",
      success: false,
    });
  }
};
